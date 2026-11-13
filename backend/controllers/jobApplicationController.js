const crypto = require("node:crypto");
const path = require("node:path");
const mongoose = require("mongoose");
const JobApplication = require("../models/JobApplication");
const {
  deleteApplicationWithResume,
  removeResumeFile,
  saveResumeFile,
} = require("../utils/resumeFiles");

const APPLICATION_STATUSES = [
  "new",
  "pending",
  "reviewed",
  "shortlisted",
  "interview_scheduled",
  "selected",
  "rejected",
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_RESUME_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_RESUME_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_RESUME_BYTES = 3 * 1024 * 1024;

const isAdmin = (req) => req.user && req.user.role === "admin";
const isValidId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

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
    return res
      .status(409)
      .json({ success: false, message: "A record with these details already exists" });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
  });
};

const saveUploadedResume = async (resumeFile) => {
  if (!resumeFile || typeof resumeFile !== "object") return { stored: null };

  const rawName = typeof resumeFile.fileName === "string" ? resumeFile.fileName.trim() : "";
  const mimeType = typeof resumeFile.mimeType === "string" ? resumeFile.mimeType.trim().toLowerCase() : "";
  const base64Raw = typeof resumeFile.base64Data === "string" ? resumeFile.base64Data.trim() : "";

  if (!rawName || !base64Raw) {
    return { error: "Invalid resume file payload" };
  }

  const ext = path.extname(rawName).toLowerCase();
  if (!ALLOWED_RESUME_EXTENSIONS.has(ext) || !ALLOWED_RESUME_MIMES.has(mimeType)) {
    return { error: "Resume must be a PDF, DOC, or DOCX file" };
  }

  const cleanedBase64 = base64Raw.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleanedBase64, "base64");
  if (!buffer.length || buffer.length > MAX_RESUME_BYTES) {
    return { error: "Resume file must be under 3 MB" };
  }

  if (ext === ".pdf" && buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
    return { error: "Uploaded PDF file appears invalid" };
  }
  if (ext === ".docx" && buffer.subarray(0, 2).toString("ascii") !== "PK") {
    return { error: "Uploaded DOCX file appears invalid" };
  }
  if (
    ext === ".doc" &&
    !buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))
  ) {
    return { error: "Uploaded DOC file appears invalid" };
  }

  const safeBaseName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const storedName = `${crypto.randomUUID()}${ext}`;
  await saveResumeFile(storedName, buffer);

  return {
    stored: {
      resumeFileName: safeBaseName,
      resumeStoredPath: storedName,
      resumeMimeType: mimeType,
    },
  };
};

const submitJobApplication = async (req, res) => {
  let savedResumePath = "";
  try {
    const {
      fullName,
      email,
      phone,
      position,
      experience,
      education,
      address,
      resumeUrl,
      coverLetter,
      resumeFile,
    } = req.body || {};

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !EMAIL_PATTERN.test(email.trim()) ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof position !== "string" ||
      !position.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name, valid email, phone, and position are required",
      });
    }
    for (const [field, value] of Object.entries({
      experience,
      education,
      address,
      resumeUrl,
      coverLetter,
    })) {
      if (value !== undefined && typeof value !== "string") {
        return res
          .status(400)
          .json({ success: false, message: `${field} must be a string` });
      }
    }

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPosition = position.trim();
    const cleanExperience =
      experience === undefined || !experience.trim() ? "Fresher" : experience.trim();
    const cleanEducation = education === undefined ? "" : education.trim();
    const cleanAddress = address === undefined ? "" : address.trim();
    const cleanResumeUrl = resumeUrl === undefined ? "" : resumeUrl.trim();
    const cleanCoverLetter = coverLetter === undefined ? "" : coverLetter.trim();

    if (
      cleanFullName.length > 120 ||
      cleanEmail.length > 160 ||
      cleanPhone.length > 30 ||
      cleanPosition.length > 160 ||
      cleanExperience.length > 120 ||
      cleanEducation.length > 200 ||
      cleanAddress.length > 500 ||
      cleanResumeUrl.length > 400 ||
      cleanCoverLetter.length > 1500
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more application fields exceed allowed character limits",
      });
    }

    if (cleanResumeUrl) {
      let parsedUrl;
      try {
        parsedUrl = new URL(cleanResumeUrl);
      } catch {
        parsedUrl = null;
      }
      if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          message: "Resume / portfolio link must be a valid http:// or https:// URL",
        });
      }
    }

    const { error: resumeError, stored } = await saveUploadedResume(resumeFile);
    if (resumeError) {
      return res.status(400).json({ success: false, message: resumeError });
    }
    savedResumePath = stored ? stored.resumeStoredPath : "";

    const application = await JobApplication.create({
      fullName: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
      position: cleanPosition,
      experience: cleanExperience,
      education: cleanEducation,
      address: cleanAddress,
      resumeUrl: cleanResumeUrl,
      resumeFileName: stored ? stored.resumeFileName : "",
      resumeStoredPath: stored ? stored.resumeStoredPath : "",
      resumeMimeType: stored ? stored.resumeMimeType : "",
      coverLetter: cleanCoverLetter,
      status: "new",
    });

    return res.status(201).json({
      success: true,
      message: "Job application submitted successfully",
      data: {
        application: {
          _id: application._id,
          fullName: application.fullName,
          email: application.email,
          phone: application.phone,
          position: application.position,
          experience: application.experience,
          education: application.education,
          resumeUrl: application.resumeUrl,
          resumeFileName: application.resumeFileName,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
    });
  } catch (error) {
    if (savedResumePath) {
      try {
        await removeResumeFile(savedResumePath);
      } catch (cleanupError) {
        console.error("Failed to clean up resume after application submission failed:", cleanupError);
        return res.status(500).json({
          success: false,
          message: "Application submission failed and resume cleanup could not be completed",
        });
      }
    }
    return handleError(res, error, "Submit job application");
  }
};

const getAllApplications = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: applications.length,
      data: { applications },
    });
  } catch (error) {
    return handleError(res, error, "Get job applications");
  }
};

const getApplicationById = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid application ID" });
  }

  try {
    const application = await JobApplication.findById(id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Job application not found" });
    }
    return res.status(200).json({ success: true, data: { application } });
  } catch (error) {
    return handleError(res, error, "Get job application");
  }
};

const updateApplicationStatus = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { status } = req.body || {};

  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid application ID" });
  }
  if (!APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
    });
  }

  try {
    const application = await JobApplication.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after", runValidators: true }
    );
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Job application not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: { application },
    });
  } catch (error) {
    return handleError(res, error, "Update application status");
  }
};

const deleteApplication = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid application ID" });
  }

  try {
    const application = await deleteApplicationWithResume(JobApplication, id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Job application not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Job application deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Delete job application");
  }
};

module.exports = {
  submitJobApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
};
