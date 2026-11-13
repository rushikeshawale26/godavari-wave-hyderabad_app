const express = require("express");
const {
  createJobOpening,
  getActiveJobOpenings,
  getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
  activateJobOpening,
  deactivateJobOpening,
} = require("../controllers/jobOpeningController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getActiveJobOpenings);
router.get("/:id", getJobOpeningById);
router.post("/", authMiddleware, adminMiddleware, createJobOpening);
router.put("/:id", authMiddleware, adminMiddleware, updateJobOpening);
router.delete("/:id", authMiddleware, adminMiddleware, deleteJobOpening);
router.patch(
  "/:id/activate",
  authMiddleware,
  adminMiddleware,
  activateJobOpening
);
router.patch(
  "/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  deactivateJobOpening
);

module.exports = router;
