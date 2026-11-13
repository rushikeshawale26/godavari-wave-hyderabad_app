const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
} = require("../controllers/enquiryController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

const enquirySubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many enquiry submissions. Please wait a few minutes and try again.",
  },
});

router.post("/", enquirySubmitLimiter, submitEnquiry);
router.get("/", authMiddleware, adminMiddleware, getAllEnquiries);
router.get("/:id", authMiddleware, adminMiddleware, getEnquiryById);
router.put("/:id/status", authMiddleware, adminMiddleware, updateEnquiryStatus);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEnquiry);

module.exports = router;
