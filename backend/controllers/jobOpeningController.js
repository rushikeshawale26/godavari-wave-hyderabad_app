const { isValidRecordId } = require("../models/postgresModel");
const JobOpening = require("../models/JobOpening");

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const EDITABLE_FIELDS = [
  "title",
  "department",
  "location",
  "jobType",
  "experience",
  "description",
  "responsibilities",
  "requirements",
  "qualifications",
  "vacancies",
  "deadline",
  "isActive",
];
const REQUIRED_TEXT_FIELDS = ["title", "department", "description"];

const isAdmin = (req) => req.user && req.user.role === "admin";
const isValidId = (id) =>
  isValidRecordId(id);

const requireAdmin = (req, res) => {
  if (!req.user) {
    res
      .status(401)
      .json({ success: false, message: "Authentication is required" });
    return false;
  }
  if (!isAdmin(req)) {
    res
      .status(403)
      .json({ success: false, message: "Administrator access is required" });
    return false;
  }
  return true;
};

const handleError = (res, error, operation) => {
  console.error(`${operation} failed:`, error);
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A job opening with this title already exists",
    });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
  });
};

const validateOpeningFields = (fields, { creating = false } = {}) => {
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (
      (creating || Object.hasOwn(fields, field)) &&
      (typeof fields[field] !== "string" || !fields[field].trim())
    ) {
      return `${field} is required and must be a non-empty string`;
    }
  }

  for (const field of ["location", "experience", "qualifications"]) {
    if (
      Object.hasOwn(fields, field) &&
      typeof fields[field] !== "string"
    ) {
      return `${field} must be a string`;
    }
  }
  if (
    Object.hasOwn(fields, "jobType") &&
    !JOB_TYPES.includes(fields.jobType)
  ) {
    return `jobType must be one of: ${JOB_TYPES.join(", ")}`;
  }
  for (const listField of ["requirements", "responsibilities"]) {
    if (
      Object.hasOwn(fields, listField) &&
      (!Array.isArray(fields[listField]) ||
        fields[listField].some(
          (item) => typeof item !== "string" || !item.trim()
        ))
    ) {
      return `${listField} must be an array of non-empty strings`;
    }
  }
  if (Object.hasOwn(fields, "vacancies")) {
    const num = Number(fields.vacancies);
    if (!Number.isInteger(num) || num < 1 || num > 500) {
      return "vacancies must be an integer between 1 and 500";
    }
  }
  if (
    Object.hasOwn(fields, "deadline") &&
    fields.deadline !== null &&
    fields.deadline !== ""
  ) {
    const parsed = new Date(fields.deadline);
    if (Number.isNaN(parsed.getTime())) {
      return "deadline must be a valid date";
    }
  }
  if (
    Object.hasOwn(fields, "isActive") &&
    typeof fields.isActive !== "boolean"
  ) {
    return "isActive must be a boolean";
  }

  return null;
};

const pickOpeningFields = (body) => {
  const fields = {};
  for (const field of EDITABLE_FIELDS) {
    if (Object.hasOwn(body, field)) {
      fields[field] = body[field];
    }
  }
  for (const field of [
    ...REQUIRED_TEXT_FIELDS,
    "location",
    "experience",
    "qualifications",
  ]) {
    if (typeof fields[field] === "string") {
      fields[field] = fields[field].trim();
    }
  }
  for (const listField of ["requirements", "responsibilities"]) {
    if (Array.isArray(fields[listField])) {
      fields[listField] = fields[listField]
        .map((item) => (typeof item === "string" ? item.trim() : item))
        .filter((item) => typeof item !== "string" || item.length > 0);
    }
  }
  if (Object.hasOwn(fields, "vacancies")) {
    fields.vacancies = Number(fields.vacancies);
  }
  if (Object.hasOwn(fields, "deadline")) {
    fields.deadline =
      fields.deadline === "" || fields.deadline === null
        ? null
        : new Date(fields.deadline);
  }
  return fields;
};

const createJobOpening = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const fields = pickOpeningFields(req.body || {});
    const validationError = validateOpeningFields(fields, { creating: true });
    if (validationError) {
      return res
        .status(400)
        .json({ success: false, message: validationError });
    }

    const opening = await JobOpening.create(fields);
    return res.status(201).json({
      success: true,
      message: "Job opening created successfully",
      data: { opening },
    });
  } catch (error) {
    return handleError(res, error, "Create job opening");
  }
};

const buildActiveFilter = () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return {
    isActive: true,
    $or: [{ deadline: null }, { deadline: { $exists: false } }, { deadline: { $gte: startOfToday } }],
  };
};

const getActiveJobOpenings = async (_req, res) => {
  try {
    const openings = await JobOpening.find(buildActiveFilter()).sort({
      createdAt: -1,
    });
    return res.status(200).json({
      success: true,
      count: openings.length,
      data: { openings },
    });
  } catch (error) {
    return handleError(res, error, "Get active job openings");
  }
};

const getJobOpeningById = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid job opening ID" });
  }

  try {
    const query = isAdmin(req) ? { _id: id } : { _id: id, ...buildActiveFilter() };
    const opening = await JobOpening.findOne(query);
    if (!opening) {
      return res
        .status(404)
        .json({ success: false, message: "Job opening not found" });
    }
    return res.status(200).json({ success: true, data: { opening } });
  } catch (error) {
    return handleError(res, error, "Get job opening");
  }
};

const updateJobOpening = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid job opening ID" });
  }

  try {
    const fields = pickOpeningFields(req.body || {});
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one supported field to update",
      });
    }
    const validationError = validateOpeningFields(fields);
    if (validationError) {
      return res
        .status(400)
        .json({ success: false, message: validationError });
    }

    const opening = await JobOpening.findByIdAndUpdate(id, fields, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!opening) {
      return res
        .status(404)
        .json({ success: false, message: "Job opening not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Job opening updated successfully",
      data: { opening },
    });
  } catch (error) {
    return handleError(res, error, "Update job opening");
  }
};

const deleteJobOpening = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid job opening ID" });
  }

  try {
    const opening = await JobOpening.findByIdAndDelete(id);
    if (!opening) {
      return res
        .status(404)
        .json({ success: false, message: "Job opening not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Job opening deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Delete job opening");
  }
};

const changeJobOpeningStatus = async (req, res, isActive) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid job opening ID" });
  }

  try {
    const opening = await JobOpening.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after", runValidators: true }
    );
    if (!opening) {
      return res
        .status(404)
        .json({ success: false, message: "Job opening not found" });
    }
    return res.status(200).json({
      success: true,
      message: `Job opening ${isActive ? "activated" : "deactivated"} successfully`,
      data: { opening },
    });
  } catch (error) {
    return handleError(res, error, "Change job opening status");
  }
};

const activateJobOpening = (req, res) =>
  changeJobOpeningStatus(req, res, true);
const deactivateJobOpening = (req, res) =>
  changeJobOpeningStatus(req, res, false);

module.exports = {
  createJobOpening,
  getActiveJobOpenings,
  getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
  activateJobOpening,
  deactivateJobOpening,
};
