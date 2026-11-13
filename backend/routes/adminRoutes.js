const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  adminSessionMiddleware,
  requireAnyAdminPermission,
  requireAdminPermission,
} = require("../middleware/adminSessionMiddleware");
const {
  adminAuthLogin,
  adminAuthLogout,
  getAdminSession,
  changeAdminPassword,
  listAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  listActivityLogs,
  getAdminOverview,
  getAdminNotifications,
  listLeads,
  exportLeadsCsv,
  getLeadById,
  updateLead,
  addLeadNote,
  deleteLead,
  listChatConversations,
  getChatConversationById,
  getFeedbackSubmissions,
  updateFeedbackStatus,
  deleteFeedback,
  getAdminSiteContent,
  updateAdminSiteContent,
} = require("../controllers/adminController");
const {
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
} = require("../controllers/adminCareersController");
const { createAdminSessionMiddleware } = require("../config/session");

const router = express.Router();
router.use(createAdminSessionMiddleware());

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts from this IP. Please wait 15 minutes and try again.",
  },
});

const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 160,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many admin requests. Please slow down briefly.",
  },
});

// Public login/logout routes
router.post("/auth/login", adminLoginLimiter, adminAuthLogin);
router.post("/auth/logout", adminAuthLogout);

// Strictly protected Admin endpoints
router.use(adminApiLimiter, adminSessionMiddleware);

router.get("/auth/me", getAdminSession);
router.put("/auth/password", changeAdminPassword);

// Admin accounts & RBAC
router.get("/accounts", requireAdminPermission("admins:manage"), listAdminAccounts);
router.post("/accounts", requireAdminPermission("admins:manage"), createAdminAccount);
router.patch(
  "/accounts/:id",
  requireAdminPermission("admins:manage"),
  updateAdminAccount
);
router.get(
  "/activity-logs",
  requireAdminPermission("admins:manage"),
  listActivityLogs
);

// Overview, Analytics & Notifications
const dashboardPermissions = [
  "leads:manage",
  "careers:manage",
  "chatbot:view",
  "admins:manage",
];
router.get(
  "/overview",
  requireAnyAdminPermission(dashboardPermissions),
  getAdminOverview
);
router.get(
  "/notifications",
  requireAnyAdminPermission(dashboardPermissions),
  getAdminNotifications
);

// Leads Management
router.get("/leads", requireAdminPermission("leads:manage"), listLeads);
router.get("/leads/export", requireAdminPermission("leads:manage"), exportLeadsCsv);
router.get("/leads/:id", requireAdminPermission("leads:manage"), getLeadById);
router.patch("/leads/:id", requireAdminPermission("leads:manage"), updateLead);
router.post("/leads/:id/notes", requireAdminPermission("leads:manage"), addLeadNote);
router.delete("/leads/:id", requireAdminPermission("leads:manage"), deleteLead);

// Careers & Job Openings Management
router.get("/jobs", requireAdminPermission("careers:manage"), listAdminJobs);
router.post("/jobs", requireAdminPermission("careers:manage"), createAdminJob);
router.put("/jobs/:id", requireAdminPermission("careers:manage"), updateAdminJob);
router.patch(
  "/jobs/:id/status",
  requireAdminPermission("careers:manage"),
  toggleAdminJobStatus
);
router.delete("/jobs/:id", requireAdminPermission("careers:manage"), deleteAdminJob);

// Job Applications Management & Secure Resume Download
router.get(
  "/applications",
  requireAdminPermission("careers:manage"),
  listAdminApplications
);
router.get(
  "/applications/export",
  requireAdminPermission("careers:manage"),
  exportApplicationsCsv
);
router.patch(
  "/applications/:id",
  requireAdminPermission("careers:manage"),
  updateAdminApplication
);
router.get(
  "/applications/:id/resume",
  requireAdminPermission("careers:manage"),
  downloadApplicationResume
);
router.delete(
  "/applications/:id",
  requireAdminPermission("careers:manage"),
  deleteAdminApplication
);

// Chatbot Conversations
router.get(
  "/chatbot/conversations",
  requireAdminPermission("chatbot:view"),
  listChatConversations
);
router.get(
  "/chatbot/conversations/:id",
  requireAdminPermission("chatbot:view"),
  getChatConversationById
);

// Feedback & Reviews
router.get(
  "/feedback",
  requireAdminPermission("content:manage"),
  getFeedbackSubmissions
);
router.patch(
  "/feedback/:id",
  requireAdminPermission("content:manage"),
  updateFeedbackStatus
);
router.delete(
  "/feedback/:id",
  requireAdminPermission("content:manage"),
  deleteFeedback
);

// Website Content Management
router.get(
  "/content",
  requireAdminPermission("content:manage"),
  getAdminSiteContent
);
router.put(
  "/content",
  requireAdminPermission("content:manage"),
  updateAdminSiteContent
);

module.exports = router;
