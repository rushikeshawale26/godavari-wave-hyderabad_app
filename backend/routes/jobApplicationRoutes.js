const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  submitJobApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} = require("../controllers/jobApplicationController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

const applicationSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many application submissions. Please try again shortly.",
  },
});

router.post("/", applicationSubmitLimiter, submitJobApplication);
router.get("/", authMiddleware, adminMiddleware, getAllApplications);
router.get("/:id", authMiddleware, adminMiddleware, getApplicationById);
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateApplicationStatus
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteApplication);

module.exports = router;
