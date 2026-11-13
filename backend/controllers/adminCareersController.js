const fs = require("node:fs");
const path = require("node:path");
const { isValidRecordId } = require("../models/postgresModel");
const JobOpening = require("../models/JobOpening");
const JobApplication = require("../models/JobApplication");
const {
  escapeRegex,
  formatDateKey,
  csvEscape,
  logAdminActivity,
} = require("../utils/adminHelpers");
const {
  RESUME_UPLOAD_DIR,
  deleteApplicationWithResume,
  resolveResumePath,
} = require("../utils/resumeFiles");

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const APPLICATION_STATUSES = [
  "new",
  "shortlisted",
  "interview_scheduled",
  "selected",
  "rejected",
  "pending",
  "reviewed",
];
const normalizeApplicationStatus = (status) => {
  if (!status || status === "pending") return "new";
  if (status === "reviewed") return "shortlisted";
  return status;
};

const sanitizeJobPayload = (body = {}, { creating = false } = {}) => {
  const fields = {};
  const textFields = [
    "title",
    "department",
    "location",
    "experience",
    "description",
    "qualifications",
  ];

  for (const field of textFields) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string") {
        return { error: `${field} must be a string` };
      }
      fields[field] = body[field].trim();
    }
  }

  for (const requiredField of ["title", "department", "description"]) {
    if ((creating || Object.hasOwn(fields, requiredField)) && !fields[requiredField]) {
      return { error: `${requiredField} is required` };
    }
  }

  if (Object.hasOwn(body, "jobType")) {
    if (!JOB_TYPES.includes(body.jobType)) {
      return { error: `jobType must be one of: ${JOB_TYPES.join(", ")}` };
    }
    fields.jobType = body.jobType;
  }

  for (const listField of ["requirements", "responsibilities"]) {
    if (Object.hasOwn(body, listField)) {
      const raw = body[listField];
      if (typeof raw === "string") {
        fields[listField] = raw
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
      } else if (Array.isArray(raw)) {
        fields[listField] = raw
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      } else {
        return { error: `${listField} must be an array or newline-separated string` };
      }
    }
  }

  if (Object.hasOwn(body, "vacancies")) {
    const count = Number(body.vacancies);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return { error: "vacancies must be an integer between 1 and 500" };
    }
    fields.vacancies = count;
  }

  if (Object.hasOwn(body, "deadline")) {
    if (body.deadline === null || body.deadline === "") {
      fields.deadline = null;
    } else {
      const parsed = new Date(body.deadline);
      if (Number.isNaN(parsed.getTime())) {
        return { error: "deadline must be a valid date" };
      }
      fields.deadline = parsed;
    }
  }

  if (Object.hasOwn(body, "isActive")) {
    if (typeof body.isActive !== "boolean") {
      return { error: "isActive must be a boolean" };
    }
    fields.isActive = body.isActive;
  }

  return { fields };
};

const listAdminJobs = async (req, res) => {
  try {
    const { q, department, jobType, status } = req.query;
    const filter = {};
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (department && department !== "all") {
      filter.department = new RegExp(`^${escapeRegex(String(department).trim())}$`, "i");
    }
    if (jobType && jobType !== "all") {
      filter.jobType = String(jobType).trim();
    }
    if (status === "active") {
      filter.isActive = true;
      filter.$or = [
        { deadline: null },
        { deadline: { $exists: false } },
        { deadline: { $gte: startOfToday } },
      ];
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "expired") {
      filter.deadline = { $lt: startOfToday };
    }

    if (typeof q === "string" && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim().slice(0, 100)), "i");
      const textOr = [
        { title: regex },
        { department: regex },
        { location: regex },
        { description: regex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: textOr }];
        delete filter.$or;
      } else {
        filter.$or = textOr;
      }
    }

    const [jobs, applicationPositions, distinctDepartments] = await Promise.all([
      JobOpening.find(filter).sort({ createdAt: -1 }).lean(),
      JobApplication.find().select("position").lean(),
      JobOpening.distinct("department"),
    ]);

    const appCountMap = new Map();
    for (const application of applicationPositions) {
      const position = String(application.position || "").toLowerCase();
      appCountMap.set(position, (appCountMap.get(position) || 0) + 1);
    }

    const enriched = jobs.map((job) => {
      const isExpired = Boolean(
        job.deadline && new Date(job.deadline) < startOfToday
      );
      return {
        ...job,
        _id: job._id.toString(),
        isExpired,
        applicationCount: appCountMap.get(job.title.toLowerCase()) || 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        jobs: enriched,
        departments: distinctDepartments.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("List admin jobs failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load job openings",
    });
  }
};

const createAdminJob = async (req, res) => {
  const { error: validationError, fields } = sanitizeJobPayload(req.body, {
    creating: true,
  });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const opening = await JobOpening.create(fields);
    void logAdminActivity({
      admin: req.admin,
      action: "job.created",
      targetType: "job",
      targetId: opening._id,
      summary: `Created job opening "${opening.title}" (${opening.department})`,
    });
    return res.status(201).json({
      success: true,
      message: "Job opening created successfully",
      data: { opening: { ...opening.toObject(), _id: opening._id.toString() } },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A job opening with this title already exists",
      });
    }
    console.error("Create admin job failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create job opening",
    });
  }
};

const updateAdminJob = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID" });
  }

  const { error: validationError, fields } = sanitizeJobPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }
  if (Object.keys(fields).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields supplied",
    });
  }

  try {
    const opening = await JobOpening.findByIdAndUpdate(id, fields, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!opening) {
      return res.status(404).json({ success: false, message: "Job opening not found" });
    }
    void logAdminActivity({
      admin: req.admin,
      action: "job.updated",
      targetType: "job",
      targetId: id,
      summary: `Updated job opening "${opening.title}"`,
    });
    return res.status(200).json({
      success: true,
      message: "Job opening updated successfully",
      data: { opening: { ...opening, _id: opening._id.toString() } },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another job opening already uses that title",
      });
    }
    console.error("Update admin job failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update job opening",
    });
  }
};

const toggleAdminJobStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body || {};
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID" });
  }
  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive boolean is required",
    });
  }

  try {
    const opening = await JobOpening.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!opening) {
      return res.status(404).json({ success: false, message: "Job opening not found" });
    }
    void logAdminActivity({
      admin: req.admin,
      action: isActive ? "job.activated" : "job.deactivated",
      targetType: "job",
      targetId: id,
      summary: `${isActive ? "Activated" : "Deactivated"} job opening "${opening.title}"`,
    });
    return res.status(200).json({
      success: true,
      message: `Job opening ${isActive ? "activated" : "deactivated"} successfully`,
      data: { opening: { ...opening, _id: opening._id.toString() } },
    });
  } catch (error) {
    console.error("Toggle admin job status failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change job opening status",
    });
  }
};

const deleteAdminJob = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID" });
  }

  try {
    const deleted = await JobOpening.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Job opening not found" });
    }
    void logAdminActivity({
      admin: req.admin,
      action: "job.deleted",
      targetType: "job",
      targetId: id,
      summary: `Deleted job opening "${deleted.title}"`,
    });
    return res.status(200).json({
      success: true,
      message: "Job opening deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin job failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete job opening",
    });
  }
};

const buildApplicationQuery = (queryParams = {}) => {
  const filter = {};
  const { q, status, position, dateFrom, dateTo } = queryParams;

  if (typeof status === "string" && status.trim() && status !== "all") {
    const s = status.trim().toLowerCase();
    if (s === "new") {
      filter.status = { $in: ["new", "pending"] };
    } else if (s === "shortlisted") {
      filter.status = { $in: ["shortlisted", "reviewed"] };
    } else if (APPLICATION_STATUSES.includes(s)) {
      filter.status = s;
    }
  }

  if (typeof position === "string" && position.trim() && position !== "all") {
    filter.position = new RegExp(`^${escapeRegex(position.trim())}$`, "i");
  }

  if (dateFrom || dateTo) {
    const range = {};
    if (typeof dateFrom === "string" && dateFrom.trim()) {
      const from = new Date(`${dateFrom.trim()}T00:00:00.000Z`);
      if (!Number.isNaN(from.getTime())) range.$gte = from;
    }
    if (typeof dateTo === "string" && dateTo.trim()) {
      const to = new Date(`${dateTo.trim()}T23:59:59.999Z`);
      if (!Number.isNaN(to.getTime())) range.$lte = to;
    }
    if (Object.keys(range).length > 0) filter.createdAt = range;
  }

  if (typeof q === "string" && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim().slice(0, 120)), "i");
    filter.$or = [
      { fullName: regex },
      { email: regex },
      { phone: regex },
      { position: regex },
      { education: regex },
    ];
  }

  return filter;
};

const listAdminApplications = async (req, res) => {
  try {
    const filter = buildApplicationQuery(req.query);
    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [rawApps, total, distinctPositions] = await Promise.all([
      JobApplication.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      JobApplication.countDocuments(filter),
      JobApplication.distinct("position"),
    ]);

    const applications = rawApps.map((app) => ({
      ...app,
      _id: app._id.toString(),
      status: normalizeApplicationStatus(app.status),
      hasResumeFile: Boolean(app.resumeFileName),
    }));

    return res.status(200).json({
      success: true,
      data: {
        applications,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        positions: distinctPositions.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("List admin applications failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load job applications",
    });
  }
};

const exportApplicationsCsv = async (req, res) => {
  try {
    const filter = buildApplicationQuery(req.query);
    const apps = await JobApplication.find(filter).sort({ createdAt: -1 }).lean();

    const header = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Position",
      "Experience",
      "Education",
      "Status",
      "Interview Date",
      "Resume Link / File",
      "Applied At",
    ];
    const rows = apps.map((app) => [
      app._id.toString(),
      app.fullName,
      app.email,
      app.phone,
      app.position,
      app.experience || "",
      app.education || "",
      normalizeApplicationStatus(app.status),
      app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 10) : "",
      app.resumeFileName || app.resumeUrl || "",
      app.createdAt ? new Date(app.createdAt).toISOString() : "",
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const stamp = formatDateKey(new Date());
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="godavari-wave-applications-${stamp}.csv"`
    );
    return res.status(200).send(`\uFEFF${csvContent}`);
  } catch (error) {
    console.error("Export applications CSV failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to export applications CSV",
    });
  }
};

const updateAdminApplication = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid application ID" });
  }

  const body = req.body || {};
  const update = {};
  const push = {};

  if (Object.hasOwn(body, "status")) {
    const s = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    if (!["new", "shortlisted", "interview_scheduled", "selected", "rejected"].includes(s)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: new, shortlisted, interview_scheduled, selected, rejected",
      });
    }
    update.status = s;
  }

  if (Object.hasOwn(body, "interviewDate")) {
    if (!body.interviewDate) {
      update.interviewDate = null;
    } else {
      const parsed = new Date(body.interviewDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid interview date" });
      }
      update.interviewDate = parsed;
    }
  }

  if (typeof body.note === "string" && body.note.trim()) {
    push.notes = {
      text: body.note.trim().slice(0, 2000),
      addedBy: req.admin?.username || "Admin",
      createdAt: new Date(),
    };
  }

  if (Object.keys(update).length === 0 && Object.keys(push).length === 0) {
    return res.status(400).json({ success: false, message: "No updates provided" });
  }

  const operation = {};
  if (Object.keys(update).length > 0) operation.$set = update;
  if (Object.keys(push).length > 0) operation.$push = push;

  try {
    const application = await JobApplication.findByIdAndUpdate(id, operation, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (update.status) {
      void logAdminActivity({
        admin: req.admin,
        action: "application.updated",
        targetType: "application",
        targetId: id,
        summary: `Updated application for ${application.fullName} (${application.position}) to "${update.status}"`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: {
        application: {
          ...application,
          _id: application._id.toString(),
          status: normalizeApplicationStatus(application.status),
          hasResumeFile: Boolean(application.resumeFileName),
        },
      },
    });
  } catch (error) {
    console.error("Update application failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update application",
    });
  }
};

const downloadApplicationResume = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid application ID" });
  }

  try {
    const application = await JobApplication.findById(id)
      .select("+resumeStoredPath resumeFileName resumeMimeType")
      .lean();

    if (!application || !application.resumeStoredPath) {
      return res.status(404).json({
        success: false,
        message: "No uploaded resume file found for this application",
      });
    }

    let resolvedPath;
    try {
      resolvedPath = resolveResumePath(application.resumeStoredPath);
    } catch {
      return res.status(403).json({ success: false, message: "Invalid file path" });
    }
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: "Uploaded resume file is missing from storage",
      });
    }

    const downloadName =
      application.resumeFileName || `resume-${id}${path.extname(resolvedPath)}`;
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Type",
      application.resumeMimeType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName.replace(/"/g, "")}"`
    );
    return res.sendFile(resolvedPath);
  } catch (error) {
    console.error("Download application resume failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to download resume",
    });
  }
};

const deleteAdminApplication = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid application ID" });
  }

  try {
    const application = await deleteApplicationWithResume(JobApplication, id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    void logAdminActivity({
      admin: req.admin,
      action: "application.deleted",
      targetType: "application",
      targetId: id,
      summary: `Deleted application from ${application.fullName} (${application.position})`,
    });

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete application failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete application",
    });
  }
};

module.exports = {
  listAdminJobs,
  createAdminJob,
  updateAdminJob,
  toggleAdminJobStatus,
  deleteAdminJob,
  listAdminApplications,
  exportApplicationsCsv,
  updateAdminApplication,
  downloadApplicationResume,
  deleteAdminApplication,
};
