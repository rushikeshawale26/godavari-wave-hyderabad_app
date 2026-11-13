const { isValidRecordId } = require("../models/postgresModel");
const Enquiry = require("../models/enquiry");

const ENQUIRY_STATUSES = [
  "new",
  "pending",
  "contacted",
  "converted",
  "closed",
  "resolved",
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, company, subject, message } = req.body || {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !EMAIL_PATTERN.test(email.trim()) ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email, phone, subject, and message are required",
      });
    }
    if (company !== undefined && typeof company !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Company must be a string" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCompany = company ? company.trim() : "";
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (
      cleanName.length > 120 ||
      cleanEmail.length > 160 ||
      cleanPhone.length > 30 ||
      cleanCompany.length > 160 ||
      cleanSubject.length > 160 ||
      cleanMessage.length > 4000
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more enquiry fields exceed allowed character limits",
      });
    }

    const enquiry = await Enquiry.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      company: cleanCompany,
      subject: cleanSubject,
      message: cleanMessage,
      status: "new",
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: { enquiry },
    });
  } catch (error) {
    return handleError(res, error, "Submit enquiry");
  }
};

const getAllEnquiries = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: { enquiries },
    });
  } catch (error) {
    return handleError(res, error, "Get enquiries");
  }
};

const getEnquiryById = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid enquiry ID" });
  }

  try {
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Enquiry not found" });
    }
    return res.status(200).json({ success: true, data: { enquiry } });
  } catch (error) {
    return handleError(res, error, "Get enquiry");
  }
};

const updateEnquiryStatus = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { status } = req.body || {};

  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid enquiry ID" });
  }
  if (!ENQUIRY_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${ENQUIRY_STATUSES.join(", ")}`,
    });
  }

  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after", runValidators: true }
    );
    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Enquiry not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully",
      data: { enquiry },
    });
  } catch (error) {
    return handleError(res, error, "Update enquiry status");
  }
};

const deleteEnquiry = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid enquiry ID" });
  }

  try {
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Enquiry not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Enquiry deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Delete enquiry");
  }
};

module.exports = {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
};
