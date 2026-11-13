const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  getChatStatus,
  postChatMessage,
} = require("../controllers/chatController");

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many assistant requests. Please try again in a few minutes.",
  },
});

router.post("/", chatLimiter, postChatMessage);
router.get("/status", getChatStatus);

module.exports = router;
