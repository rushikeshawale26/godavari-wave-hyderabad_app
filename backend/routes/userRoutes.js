const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  adminLogin,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const userAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post("/register", userAuthLimiter, registerUser);
router.post("/login", userAuthLimiter, loginUser);
router.post("/admin-login", userAuthLimiter, adminLogin);
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);

module.exports = router;
