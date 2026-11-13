const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  getWebsiteVisitorCount,
  recordWebsiteVisitor,
} = require("../controllers/websiteVisitorController");

const router = express.Router();

const visitorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many visitor-count requests. Please try again later.",
  },
});

router.get("/", getWebsiteVisitorCount);
router.post("/visit", visitorLimiter, recordWebsiteVisitor);

module.exports = router;
