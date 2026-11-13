const bcrypt = require("bcryptjs");
const { isValidRecordId } = require("../models/postgresModel");
const Admin = require("../models/Admin");
const AdminActivity = require("../models/AdminActivity");
const Enquiry = require("../models/enquiry");
const ChatConversation = require("../models/ChatConversation");
const JobApplication = require("../models/JobApplication");
const JobOpening = require("../models/JobOpening");
const WebsiteVisitor = require("../models/WebsiteVisitor");
const Feedback = require("../models/Feedback");
const SiteContent = require("../models/SiteContent");
const {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  ALLOWED_ADMIN_ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  hasAdminPermission,
} = require("../middleware/adminSessionMiddleware");
const {
  getAdminSessionCookieOptions,
} = require("../config/session");
const {
  escapeRegex,
  formatDateKey,
  csvEscape,
  logAdminActivity,
} = require("../utils/adminHelpers");

const LEAD_STATUSES = ["new", "pending", "contacted", "converted", "closed"];
const PRIORITY_LEVELS = ["high", "medium", "low"];
const LEGACY_STATUS_MAP = { resolved: "closed" };
const PASSWORD_ROUNDS = 12;
const ADMIN_PERMISSION_KEYS = [
  "admins:manage",
  "leads:manage",
  "careers:manage",
  "chatbot:view",
  "content:manage",
];

const validateAdminPermissions = (role, permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return { error: "permissions must be a non-empty array" };
  }
  if (permissions.some((permission) => typeof permission !== "string")) {
    return { error: "Every permission must be a string" };
  }

  const cleanPermissions = [...new Set(permissions)];
  const isFullAdmin = ["admin", "super_admin"].includes(role);
  if (cleanPermissions.includes("*")) {
    if (!isFullAdmin || cleanPermissions.length !== 1) {
      return { error: "The wildcard permission is only valid by itself for admin roles" };
    }
    return { permissions: cleanPermissions };
  }
  if (isFullAdmin) {
    return { error: "Admin roles must retain the wildcard permission" };
  }

  const unsupported = cleanPermissions.filter(
    (permission) => !ADMIN_PERMISSION_KEYS.includes(permission)
  );
  if (unsupported.length > 0) {
    return { error: `Unsupported permissions: ${unsupported.join(", ")}` };
  }
  return { permissions: cleanPermissions };
};

const sanitizeAdminUser = (admin) => ({
  _id: admin._id.toString(),
  username: admin.username,
  role: admin.role,
  permissions:
    Array.isArray(admin.permissions) && admin.permissions.length > 0
      ? admin.permissions
      : ROLE_DEFAULT_PERMISSIONS[admin.role] || ["chatbot:view"],
  isActive: Boolean(admin.isActive),
  createdAt: admin.createdAt || null,
});

const normalizeLeadStatus = (status) => {
  if (!status) return "new";
  return LEGACY_STATUS_MAP[status] || status;
};

const normalizeLeadPriority = (lead) => {
  if (PRIORITY_LEVELS.includes(lead.priority)) return lead.priority;
  return lead.isPriority ? "high" : "medium";
};

const formatMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const buildLeadQuery = (queryParams = {}) => {
  const filter = {};
  const { q, status, service, priority, dateFrom, dateTo } = queryParams;

  if (typeof status === "string" && status.trim() && status !== "all") {
    const normalized = status.trim().toLowerCase();
    if (normalized === "closed") {
      filter.status = { $in: ["closed", "resolved"] };
    } else if (LEAD_STATUSES.includes(normalized)) {
      filter.status = normalized;
    }
  }

  if (typeof service === "string" && service.trim() && service !== "all") {
    filter.subject = new RegExp(`^${escapeRegex(service.trim())}$`, "i");
  }

  if (priority === "true" || priority === true || priority === "high") {
    filter.$or = [{ priority: "high" }, { isPriority: true }];
  } else if (typeof priority === "string" && PRIORITY_LEVELS.includes(priority)) {
    filter.priority = priority;
  }

  if (dateFrom || dateTo) {
    const range = {};
    if (typeof dateFrom === "string" && dateFrom.trim()) {
      const parsedFrom = new Date(`${dateFrom.trim()}T00:00:00.000Z`);
      if (!Number.isNaN(parsedFrom.getTime())) range.$gte = parsedFrom;
    }
    if (typeof dateTo === "string" && dateTo.trim()) {
      const parsedTo = new Date(`${dateTo.trim()}T23:59:59.999Z`);
      if (!Number.isNaN(parsedTo.getTime())) range.$lte = parsedTo;
    }
    if (Object.keys(range).length > 0) filter.createdAt = range;
  }

  if (typeof q === "string" && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim().slice(0, 120)), "i");
    const searchOr = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { company: regex },
      { subject: regex },
      { message: regex },
      { assignedTo: regex },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  return filter;
};

const adminAuthLogin = async (req, res) => {
  try {
    const rawUsername = req.body?.username;
    const password = req.body?.password;

    if (
      typeof rawUsername !== "string" ||
      !rawUsername.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const username = rawUsername.trim().toLowerCase();
    const admin = await Admin.findOne({ username }).select("+passwordHash");

    if (
      !admin ||
      !(await bcrypt.compare(password, admin.passwordHash)) ||
      !ALLOWED_ADMIN_ROLES.includes(admin.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin username or password",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "This administrator account is inactive",
      });
    }

    if (!req.session) {
      console.error("Admin login error: session middleware is not active");
      return res.status(500).json({
        success: false,
        message: "Session service is currently unavailable",
      });
    }

    // Session fixation protection: regenerate session ID upon authentication
    return req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error("Session regeneration failed:", regenErr);
        return res.status(500).json({
          success: false,
          message: "Unable to establish secure session",
        });
      }

      req.session.adminId = admin._id.toString();
      req.session.role = admin.role;
      req.session.username = admin.username;
      req.session.loginTime = new Date().toISOString();

      return req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save failed:", saveErr);
          return res.status(500).json({
            success: false,
            message: "Unable to save session",
          });
        }

        // Clear any legacy persistent cookie if present
        res.clearCookie(ADMIN_COOKIE_NAME, getAdminSessionCookieOptions());

        void logAdminActivity({
          admin,
          action: "admin.login",
          targetType: "session",
          summary: `Signed into Admin Management System as @${admin.username} via secure browser session`,
        });

        return res.status(200).json({
          success: true,
          message: "Authenticated successfully",
          data: {
            admin: sanitizeAdminUser(admin),
            expiresAt: null,
          },
        });
      });
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 500 ? error.message : "Unable to complete sign-in",
    });
  }
};

const adminAuthLogout = (req, res) => {
  const cookieOpts = getAdminSessionCookieOptions();

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Admin session destroy error:", err);
      }
    });
  }

  res.clearCookie(ADMIN_SESSION_COOKIE_NAME, cookieOpts);
  res.clearCookie(ADMIN_COOKIE_NAME, cookieOpts);

  return res.status(200).json({
    success: true,
    message: "Signed out successfully",
  });
};

const getAdminSession = (req, res) =>
  res.status(200).json({
    success: true,
    data: {
      admin: sanitizeAdminUser(req.admin),
      expiresAt: null,
    },
  });

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and a new password (at least 8 characters) are required",
      });
    }

    const admin = await Admin.findById(req.admin._id).select("+passwordHash");
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, PASSWORD_ROUNDS);
    await admin.save();

    void logAdminActivity({
      admin: req.admin,
      action: "admin.password_changed",
      targetType: "admin",
      targetId: admin._id,
      summary: `Updated password for @${admin.username}`,
    });

    return res.status(200).json({
      success: true,
      message: "Admin password updated successfully",
    });
  } catch (error) {
    console.error("Change admin password failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update password",
    });
  }
};

const listAdminAccounts = async (_req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: { admins: admins.map(sanitizeAdminUser) },
    });
  } catch (error) {
    console.error("List admin accounts failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin accounts",
    });
  }
};

const createAdminAccount = async (req, res) => {
  try {
    const { username, password, role, permissions } = req.body || {};
    const cleanUsername =
      typeof username === "string" ? username.trim().toLowerCase() : "";

    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 80 characters",
      });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const assignedRole = role === undefined ? "sales_manager" : role;
    if (!ALLOWED_ADMIN_ROLES.includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        message: `role must be one of: ${ALLOWED_ADMIN_ROLES.join(", ")}`,
      });
    }

    const permissionResult =
      permissions === undefined
        ? { permissions: ROLE_DEFAULT_PERMISSIONS[assignedRole] }
        : validateAdminPermissions(assignedRole, permissions);
    if (permissionResult.error) {
      return res.status(400).json({
        success: false,
        message: permissionResult.error,
      });
    }

    const existing = await Admin.exists({ username: cleanUsername });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An admin account with this username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
    const created = await Admin.create({
      username: cleanUsername,
      passwordHash,
      role: assignedRole,
      permissions: permissionResult.permissions,
      isActive: true,
    });

    void logAdminActivity({
      admin: req.admin,
      action: "admin.account_created",
      targetType: "admin",
      targetId: created._id,
      summary: `Provisioned @${created.username} (${created.role})`,
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: { admin: sanitizeAdminUser(created) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }
    console.error("Create admin account failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create admin account",
    });
  }
};

const updateAdminAccount = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid admin ID" });
  }

  const body = req.body || {};
  const supportedFields = ["isActive", "role", "permissions"];
  const unsupportedFields = Object.keys(body).filter(
    (field) => !supportedFields.includes(field)
  );
  if (unsupportedFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Unsupported fields: ${unsupportedFields.join(", ")}`,
    });
  }
  if (Object.keys(body).length === 0) {
    return res.status(400).json({ success: false, message: "No updates provided" });
  }
  if (Object.hasOwn(body, "isActive") && typeof body.isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be boolean",
    });
  }
  if (
    Object.hasOwn(body, "isActive") &&
    id === req.admin._id.toString() &&
    !body.isActive
  ) {
    return res.status(400).json({
      success: false,
      message: "You cannot deactivate your own currently signed-in account",
    });
  }
  if (
    Object.hasOwn(body, "role") &&
    !ALLOWED_ADMIN_ROLES.includes(body.role)
  ) {
    return res.status(400).json({
      success: false,
      message: `role must be one of: ${ALLOWED_ADMIN_ROLES.join(", ")}`,
    });
  }
  if (
    Object.hasOwn(body, "role") &&
    id === req.admin._id.toString() &&
    !["admin", "super_admin"].includes(body.role)
  ) {
    return res.status(400).json({
      success: false,
      message: "You cannot downgrade your own currently signed-in admin role",
    });
  }

  try {
    const current = await Admin.findById(id).select("role").lean();
    if (!current) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const targetRole = body.role || current.role;
    const updates = {};
    if (Object.hasOwn(body, "isActive")) updates.isActive = body.isActive;
    if (Object.hasOwn(body, "role")) updates.role = targetRole;

    if (Object.hasOwn(body, "permissions")) {
      const permissionResult = validateAdminPermissions(
        targetRole,
        body.permissions
      );
      if (permissionResult.error) {
        return res.status(400).json({
          success: false,
          message: permissionResult.error,
        });
      }
      updates.permissions = permissionResult.permissions;
    } else if (Object.hasOwn(body, "role")) {
      updates.permissions = ROLE_DEFAULT_PERMISSIONS[targetRole];
    }

    const updated = await Admin.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    void logAdminActivity({
      admin: req.admin,
      action: "admin.account_updated",
      targetType: "admin",
      targetId: id,
      summary: `Updated account @${updated.username}`,
    });

    return res.status(200).json({
      success: true,
      message: "Admin account updated successfully",
      data: { admin: sanitizeAdminUser(updated) },
    });
  } catch (error) {
    console.error("Update admin account failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update admin account",
    });
  }
};

const listActivityLogs = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const logs = await AdminActivity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.status(200).json({
      success: true,
      data: {
        logs: logs.map((item) => ({ ...item, _id: item._id.toString() })),
      },
    });
  } catch (error) {
    console.error("List activity logs failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin activity logs",
    });
  }
};

const getAdminOverview = async (req, res) => {
  try {
    const canViewLeads = hasAdminPermission(req.admin, "leads:manage");
    const canViewCareers = hasAdminPermission(req.admin, "careers:manage");
    const canViewChat = hasAdminPermission(req.admin, "chatbot:view");
    const canViewAll = hasAdminPermission(req.admin, "admins:manage");

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(now.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const visitorPeriodDays = Number(process.env.VISITOR_COUNT_PERIOD_DAYS) || 30;
    const visitorCutoff = new Date(
      now.getTime() - visitorPeriodDays * 24 * 60 * 60 * 1000
    );

    const [
      allEnquiries,
      allApplications,
      allJobs,
      recentChats,
      visitorCount,
      chatStatsAgg,
    ] = await Promise.all([
      canViewLeads
        ? Enquiry.find().sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      canViewCareers
        ? JobApplication.find().sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      canViewCareers
        ? JobOpening.find().sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      canViewChat
        ? ChatConversation.find().sort({ lastMessageAt: -1 }).limit(6).lean()
        : Promise.resolve([]),
      canViewAll
        ? WebsiteVisitor.countDocuments({
            lastCountedAt: { $gte: visitorCutoff },
          })
        : Promise.resolve(0),
      canViewChat
        ? ChatConversation.find()
            .select("userQuestionsCount unansweredCount")
            .lean()
            .then((conversations) => [
              {
                totalConversations: conversations.length,
                totalQuestions: conversations.reduce(
                  (total, conversation) => total + (conversation.userQuestionsCount || 0),
                  0
                ),
                unansweredQuestions: conversations.reduce(
                  (total, conversation) => total + (conversation.unansweredCount || 0),
                  0
                ),
              },
            ])
        : Promise.resolve([]),
    ]);

    const statusCounts = {
      new: 0,
      pending: 0,
      contacted: 0,
      converted: 0,
      closed: 0,
    };
    const serviceCountsMap = new Map();
    const sourceCountsMap = new Map();
    const dailyMap = new Map();
    const weeklyMap = new Map();
    const monthlyMap = new Map();

    for (let i = 0; i < 30; i += 1) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      dailyMap.set(formatDateKey(d), 0);
    }

    for (let w = 7; w >= 0; w -= 1) {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - w * 7);
      const label = `Wk ${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
      weeklyMap.set(w, { label, count: 0 });
    }

    for (let i = 0; i < 6; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      monthlyMap.set(formatMonthKey(d), {
        month: formatMonthKey(d),
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        total: 0,
        converted: 0,
      });
    }

    let highPriorityLeads = 0;
    let followUpsDue = 0;

    for (const lead of allEnquiries) {
      const normalizedStatus = normalizeLeadStatus(lead.status);
      if (Object.hasOwn(statusCounts, normalizedStatus)) {
        statusCounts[normalizedStatus] += 1;
      }

      if (normalizeLeadPriority(lead) === "high") highPriorityLeads += 1;

      if (
        lead.followUpDate &&
        new Date(lead.followUpDate) <= tomorrowEnd &&
        !["converted", "closed"].includes(normalizedStatus)
      ) {
        followUpsDue += 1;
      }

      const serviceKey = (lead.subject || "General Enquiry").trim();
      serviceCountsMap.set(
        serviceKey,
        (serviceCountsMap.get(serviceKey) || 0) + 1
      );

      const sourceKey = (lead.source || "Website Contact Form").trim();
      sourceCountsMap.set(sourceKey, (sourceCountsMap.get(sourceKey) || 0) + 1);

      if (lead.createdAt) {
        const created = new Date(lead.createdAt);
        if (created >= thirtyDaysAgo) {
          const dayKey = formatDateKey(created);
          if (dailyMap.has(dayKey)) {
            dailyMap.set(dayKey, dailyMap.get(dayKey) + 1);
          }
        }
        const diffDays = Math.floor(
          (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000)
        );
        const weekIndex = Math.floor(diffDays / 7);
        if (weekIndex >= 0 && weekIndex <= 7 && weeklyMap.has(weekIndex)) {
          weeklyMap.get(weekIndex).count += 1;
        }
        if (created >= sixMonthsStart) {
          const mKey = formatMonthKey(created);
          if (monthlyMap.has(mKey)) {
            const bucket = monthlyMap.get(mKey);
            bucket.total += 1;
            if (normalizedStatus === "converted") bucket.converted += 1;
          }
        }
      }
    }

    const appStatusCounts = {
      new: 0,
      shortlisted: 0,
      interview_scheduled: 0,
      selected: 0,
      rejected: 0,
    };
    const appPositionMap = new Map();

    for (const app of allApplications) {
      let s = app.status || "new";
      if (s === "pending") s = "new";
      if (s === "reviewed") s = "shortlisted";
      if (Object.hasOwn(appStatusCounts, s)) appStatusCounts[s] += 1;

      const pos = (app.position || "General application").trim();
      appPositionMap.set(pos, (appPositionMap.get(pos) || 0) + 1);
    }

    const activeJobOpenings = allJobs.filter((job) => {
      if (!job.isActive) return false;
      if (job.deadline && new Date(job.deadline) < startOfToday) return false;
      return true;
    }).length;

    const totalLeads = allEnquiries.length;
    const conversionRate =
      totalLeads > 0
        ? Math.round((statusCounts.converted / totalLeads) * 1000) / 10
        : 0;

    const chatStats = chatStatsAgg[0] || {
      totalConversations: 0,
      totalQuestions: 0,
      unansweredQuestions: 0,
    };

    const visitorTrackingEnabled = Boolean(
      process.env.NODE_ENV === "production" && process.env.VISITOR_ID_HASH_SECRET
    );

    const activityItems = [
      ...allEnquiries.slice(0, 6).map((lead) => ({
        id: `lead-${lead._id}`,
        type: "lead",
        leadId: lead._id.toString(),
        title: `Enquiry from ${lead.name}`,
        subtitle: `${lead.subject}${lead.company ? ` · ${lead.company}` : ""}`,
        status: normalizeLeadStatus(lead.status),
        timestamp: lead.updatedAt || lead.createdAt,
      })),
      ...allApplications.slice(0, 6).map((app) => ({
        id: `job-${app._id}`,
        type: "career",
        title: `Job application: ${app.fullName}`,
        subtitle: app.position,
        status: app.status === "pending" ? "new" : app.status || "new",
        timestamp: app.createdAt,
      })),
      ...recentChats.map((chat) => ({
        id: `chat-${chat._id}`,
        type: "chatbot",
        conversationId: chat._id.toString(),
        title: `Chatbot session ${chat.sessionId.slice(0, 12)}`,
        subtitle: chat.lastQuestion || "Visitor assistant conversation",
        status: chat.unansweredCount > 0 ? "attention" : "answered",
        timestamp: chat.lastMessageAt || chat.updatedAt || chat.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalLeads,
          newEnquiries: statusCounts.new,
          pendingEnquiries: statusCounts.pending,
          contactedLeads: statusCounts.contacted,
          convertedLeads: statusCounts.converted,
          closedLeads: statusCounts.closed,
          priorityLeads: highPriorityLeads,
          followUpsDue,
          conversionRate,
          totalJobApplications: allApplications.length,
          newApplications: appStatusCounts.new,
          activeJobOpenings,
          totalJobOpenings: allJobs.length,
          totalWebsiteVisitors: visitorCount,
          visitorPeriodDays,
          visitorTrackingEnabled,
          totalChatbotConversations: chatStats.totalConversations,
          totalChatbotQuestions: chatStats.totalQuestions,
          unansweredChatbotQuestions: chatStats.unansweredQuestions,
        },
        charts: {
          leadsOverTime: Array.from(dailyMap.entries()).map(([date, count]) => ({
            date,
            count,
          })),
          weeklyEnquiries: Array.from(weeklyMap.values()),
          monthlyTrends: Array.from(monthlyMap.values()),
          enquiriesByService: Array.from(serviceCountsMap.entries())
            .map(([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          enquirySources: Array.from(sourceCountsMap.entries())
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count),
          statusDistribution: LEAD_STATUSES.map((status) => ({
            status,
            count: statusCounts[status],
          })),
          jobApplicationStats: {
            byStatus: Object.entries(appStatusCounts).map(([status, count]) => ({
              status,
              count,
            })),
            byPosition: Array.from(appPositionMap.entries())
              .map(([position, count]) => ({ position, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 8),
          },
          chatbotUsage: {
            answeredQuestions: Math.max(
              0,
              chatStats.totalQuestions - chatStats.unansweredQuestions
            ),
            unansweredQuestions: chatStats.unansweredQuestions,
            totalSessions: chatStats.totalConversations,
          },
        },
        recentActivity: activityItems,
      },
    });
  } catch (error) {
    console.error("Admin overview failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin overview analytics",
    });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const canViewLeads = hasAdminPermission(req.admin, "leads:manage");
    const canViewCareers = hasAdminPermission(req.admin, "careers:manage");
    const canViewAdminActivity = hasAdminPermission(
      req.admin,
      "admins:manage"
    );

    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const [
      newLeads,
      pendingLeads,
      followUpLeads,
      newApplications,
      recentAdminLogs,
    ] = await Promise.all([
      canViewLeads
        ? Enquiry.find({ status: "new" })
            .sort({ createdAt: -1 })
            .limit(8)
            .select("name subject company createdAt status")
            .lean()
        : Promise.resolve([]),
      canViewLeads
        ? Enquiry.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .limit(8)
            .select("name subject createdAt status")
            .lean()
        : Promise.resolve([]),
      canViewLeads
        ? Enquiry.find({
            followUpDate: { $ne: null, $lte: tomorrowEnd },
            status: { $nin: ["converted", "closed", "resolved"] },
          })
            .sort({ followUpDate: 1 })
            .limit(10)
            .select("name subject followUpDate followUpNote assignedTo status")
            .lean()
        : Promise.resolve([]),
      canViewCareers
        ? JobApplication.find({ status: { $in: ["new", "pending"] } })
            .sort({ createdAt: -1 })
            .limit(8)
            .select("fullName position email createdAt status")
            .lean()
        : Promise.resolve([]),
      canViewAdminActivity
        ? AdminActivity.find().sort({ createdAt: -1 }).limit(12).lean()
        : Promise.resolve([]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        newLeads: newLeads.map((l) => ({ ...l, _id: l._id.toString() })),
        pendingLeads: pendingLeads.map((l) => ({ ...l, _id: l._id.toString() })),
        followUpReminders: followUpLeads.map((l) => ({
          ...l,
          _id: l._id.toString(),
        })),
        newApplications: newApplications.map((a) => ({
          ...a,
          _id: a._id.toString(),
        })),
        adminActivity: recentAdminLogs.map((log) => ({
          ...log,
          _id: log._id.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Get admin notifications failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
};

const listLeads = async (req, res) => {
  try {
    const filter = buildLeadQuery(req.query);
    const sortParam =
      req.query.sort === "oldest"
        ? { createdAt: 1 }
        : req.query.sort === "followup"
          ? { followUpDate: 1, createdAt: -1 }
          : { createdAt: -1 };

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [rawLeads, total, distinctServices] = await Promise.all([
      Enquiry.find(filter).sort(sortParam).skip(skip).limit(limit).lean(),
      Enquiry.countDocuments(filter),
      Enquiry.distinct("subject"),
    ]);

    const leads = rawLeads.map((lead) => ({
      ...lead,
      _id: lead._id.toString(),
      status: normalizeLeadStatus(lead.status),
      priority: normalizeLeadPriority(lead),
      isPriority: normalizeLeadPriority(lead) === "high",
    }));

    return res.status(200).json({
      success: true,
      data: {
        leads,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        services: distinctServices.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("List admin leads failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch leads",
    });
  }
};

const exportLeadsCsv = async (req, res) => {
  try {
    const filter = buildLeadQuery(req.query);
    const sortParam =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const leads = await Enquiry.find(filter).sort(sortParam).lean();

    const header = [
      "ID",
      "Customer Name",
      "Email",
      "Phone",
      "Company",
      "Interested Service",
      "Source",
      "Status",
      "Priority",
      "Assigned To",
      "Follow-up Date",
      "Submitted At",
      "Message",
    ];

    const rows = leads.map((lead) => [
      lead._id.toString(),
      lead.name,
      lead.email,
      lead.phone,
      lead.company || "",
      lead.subject,
      lead.source || "Website Contact Form",
      normalizeLeadStatus(lead.status),
      normalizeLeadPriority(lead),
      lead.assignedTo || "",
      lead.followUpDate
        ? new Date(lead.followUpDate).toISOString().slice(0, 10)
        : "",
      lead.createdAt ? new Date(lead.createdAt).toISOString() : "",
      lead.message,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const fileStamp = formatDateKey(new Date());
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="godavari-wave-leads-${fileStamp}.csv"`
    );
    return res.status(200).send(`\uFEFF${csvContent}`);
  } catch (error) {
    console.error("Export leads CSV failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to export leads CSV",
    });
  }
};

const getLeadById = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid lead ID" });
  }

  try {
    const lead = await Enquiry.findById(id).lean();
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    return res.status(200).json({
      success: true,
      data: {
        lead: {
          ...lead,
          _id: lead._id.toString(),
          status: normalizeLeadStatus(lead.status),
          priority: normalizeLeadPriority(lead),
          isPriority: normalizeLeadPriority(lead) === "high",
        },
      },
    });
  } catch (error) {
    console.error("Get lead detail failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load lead details",
    });
  }
};

const updateLead = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid lead ID" });
  }

  const body = req.body || {};
  const updates = {};

  if (Object.hasOwn(body, "status")) {
    const nextStatus =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    if (!LEAD_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${LEAD_STATUSES.join(", ")}`,
      });
    }
    updates.status = nextStatus;
  }

  if (Object.hasOwn(body, "priority")) {
    const nextPriority =
      typeof body.priority === "string"
        ? body.priority.trim().toLowerCase()
        : "";
    if (!PRIORITY_LEVELS.includes(nextPriority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${PRIORITY_LEVELS.join(", ")}`,
      });
    }
    updates.priority = nextPriority;
    updates.isPriority = nextPriority === "high";
  } else if (Object.hasOwn(body, "isPriority")) {
    if (typeof body.isPriority !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPriority must be a boolean",
      });
    }
    updates.isPriority = body.isPriority;
    updates.priority = body.isPriority ? "high" : "medium";
  }

  if (Object.hasOwn(body, "assignedTo")) {
    if (
      typeof body.assignedTo !== "string" ||
      body.assignedTo.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Assigned team member must be 100 characters or fewer",
      });
    }
    updates.assignedTo = body.assignedTo.trim();
  }

  if (Object.hasOwn(body, "followUpDate")) {
    if (body.followUpDate === null || body.followUpDate === "") {
      updates.followUpDate = null;
    } else {
      const parsedDate = new Date(body.followUpDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date must be a valid date",
        });
      }
      updates.followUpDate = parsedDate;
    }
  }

  if (Object.hasOwn(body, "followUpNote")) {
    if (
      typeof body.followUpNote !== "string" ||
      body.followUpNote.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Follow-up reminder must be 500 characters or fewer",
      });
    }
    updates.followUpNote = body.followUpNote.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid update fields were provided",
    });
  }

  try {
    const lead = await Enquiry.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    void logAdminActivity({
      admin: req.admin,
      action: "lead.updated",
      targetType: "lead",
      targetId: id,
      summary: `Updated lead "${lead.name}" (${Object.keys(updates).join(", ")})`,
    });

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: {
        lead: {
          ...lead,
          _id: lead._id.toString(),
          status: normalizeLeadStatus(lead.status),
          priority: normalizeLeadPriority(lead),
          isPriority: normalizeLeadPriority(lead) === "high",
        },
      },
    });
  } catch (error) {
    console.error("Update lead failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update lead",
    });
  }
};

const addLeadNote = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid lead ID" });
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text || text.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Note text must be between 1 and 2,000 characters",
    });
  }

  try {
    const addedBy = req.admin?.username || "Admin";
    const lead = await Enquiry.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            text,
            addedBy,
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    void logAdminActivity({
      admin: req.admin,
      action: "lead.note_added",
      targetType: "lead",
      targetId: id,
      summary: `Added internal note on lead "${lead.name}"`,
    });

    return res.status(201).json({
      success: true,
      message: "Note added successfully",
      data: {
        lead: {
          ...lead,
          _id: lead._id.toString(),
          status: normalizeLeadStatus(lead.status),
          priority: normalizeLeadPriority(lead),
          isPriority: normalizeLeadPriority(lead) === "high",
        },
      },
    });
  } catch (error) {
    console.error("Add lead note failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save admin note",
    });
  }
};

const deleteLead = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid lead ID" });
  }

  try {
    const deleted = await Enquiry.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    void logAdminActivity({
      admin: req.admin,
      action: "lead.deleted",
      targetType: "lead",
      targetId: id,
      summary: `Deleted enquiry from "${deleted.name}" (${deleted.email})`,
    });
    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete lead",
    });
  }
};

const listChatConversations = async (req, res) => {
  try {
    const { q, dateFrom, dateTo, onlyUnanswered } = req.query;
    const filter = {};

    if (onlyUnanswered === "true") {
      filter.unansweredCount = { $gt: 0 };
    }

    if (dateFrom || dateTo) {
      const range = {};
      if (typeof dateFrom === "string" && dateFrom.trim()) {
        const parsedFrom = new Date(`${dateFrom.trim()}T00:00:00.000Z`);
        if (!Number.isNaN(parsedFrom.getTime())) range.$gte = parsedFrom;
      }
      if (typeof dateTo === "string" && dateTo.trim()) {
        const parsedTo = new Date(`${dateTo.trim()}T23:59:59.999Z`);
        if (!Number.isNaN(parsedTo.getTime())) range.$lte = parsedTo;
      }
      if (Object.keys(range).length > 0) filter.lastMessageAt = range;
    }

    if (typeof q === "string" && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim().slice(0, 120)), "i");
      filter.$or = [
        { sessionId: regex },
        { lastQuestion: regex },
        { lastReply: regex },
        { "messages.content": regex },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [conversations, total, allRecentForAnalytics] = await Promise.all([
      ChatConversation.find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatConversation.countDocuments(filter),
      ChatConversation.find()
        .sort({ lastMessageAt: -1 })
        .limit(250)
        .select("sessionId messages lastMessageAt")
        .lean(),
    ]);

    const questionFreqMap = new Map();
    const unansweredList = [];

    for (const convo of allRecentForAnalytics) {
      const msgs = convo.messages || [];
      for (let i = 0; i < msgs.length; i += 1) {
        const turn = msgs[i];
        if (turn.role === "user") {
          const normalized = turn.content
            .trim()
            .toLowerCase()
            .replace(/[?!.,]+$/, "");
          if (normalized) {
            const existing = questionFreqMap.get(normalized) || {
              question: turn.content.trim(),
              count: 0,
              lastAskedAt: turn.createdAt || convo.lastMessageAt,
            };
            existing.count += 1;
            const turnTime = new Date(turn.createdAt || convo.lastMessageAt);
            if (turnTime > new Date(existing.lastAskedAt)) {
              existing.lastAskedAt = turnTime;
            }
            questionFreqMap.set(normalized, existing);
          }
        } else if (turn.role === "assistant" && turn.failedOrUnanswered) {
          const prevUser = i > 0 && msgs[i - 1].role === "user" ? msgs[i - 1] : null;
          unansweredList.push({
            conversationId: convo._id.toString(),
            sessionId: convo.sessionId,
            question: prevUser ? prevUser.content : "(question unavailable)",
            response: turn.content,
            source: turn.source || "fallback",
            createdAt: turn.createdAt || convo.lastMessageAt,
          });
        }
      }
    }

    const frequentQuestions = Array.from(questionFreqMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const unansweredQuestions = unansweredList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 25);

    return res.status(200).json({
      success: true,
      data: {
        conversations: conversations.map((c) => ({
          ...c,
          _id: c._id.toString(),
        })),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        frequentQuestions,
        unansweredQuestions,
      },
    });
  } catch (error) {
    console.error("List chatbot conversations failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load chatbot conversations",
    });
  }
};

const getChatConversationById = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid conversation ID" });
  }

  try {
    const conversation = await ChatConversation.findById(id).lean();
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          ...conversation,
          _id: conversation._id.toString(),
        },
      },
    });
  } catch (error) {
    console.error("Get chatbot conversation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load conversation transcript",
    });
  }
};

const getFeedbackSubmissions = async (_req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: {
        supported: true,
        items: items.map((item) => ({ ...item, _id: item._id.toString() })),
        message:
          items.length === 0
            ? "No customer feedback or reviews submitted yet. Only real database submissions appear here."
            : "",
      },
    });
  } catch (error) {
    console.error("List feedback failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load feedback submissions",
    });
  }
};

const updateFeedbackStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid feedback ID" });
  }
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be pending, approved, or rejected",
    });
  }

  try {
    const updated = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    void logAdminActivity({
      admin: req.admin,
      action: "feedback.moderated",
      targetType: "feedback",
      targetId: id,
      summary: `Set feedback status to "${status}"`,
    });
    return res.status(200).json({
      success: true,
      message: "Feedback status updated",
      data: { feedback: { ...updated, _id: updated._id.toString() } },
    });
  } catch (error) {
    console.error("Update feedback status failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update feedback status",
    });
  }
};

const deleteFeedback = async (req, res) => {
  const { id } = req.params;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ success: false, message: "Invalid feedback ID" });
  }

  try {
    const deleted = await Feedback.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    void logAdminActivity({
      admin: req.admin,
      action: "feedback.deleted",
      targetType: "feedback",
      targetId: id,
      summary: `Deleted feedback entry from "${deleted.customerName || "Anonymous"}"`,
    });
    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Delete feedback failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete feedback",
    });
  }
};

const getAdminSiteContent = async (_req, res) => {
  try {
    const doc = await SiteContent.findOne({ key: "main" }).lean();
    return res.status(200).json({
      success: true,
      data: {
        content: doc || {
          key: "main",
          hero: { eyebrow: "", subtitle: "" },
          branches: [],
          servicesOverrides: [],
          projectsOverrides: [],
        },
      },
    });
  } catch (error) {
    console.error("Get admin site content failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load website content settings",
    });
  }
};

const updateAdminSiteContent = async (req, res) => {
  try {
    const body = req.body || {};
    const update = { updatedBy: req.admin?.username || "admin" };

    if (body.hero && typeof body.hero === "object") {
      update.hero = {
        eyebrow:
          typeof body.hero.eyebrow === "string"
            ? body.hero.eyebrow.trim().slice(0, 140)
            : "",
        subtitle:
          typeof body.hero.subtitle === "string"
            ? body.hero.subtitle.trim().slice(0, 600)
            : "",
      };
    }

    if (Array.isArray(body.branches)) {
      update.branches = body.branches
        .filter((b) => b && typeof b.id === "string" && typeof b.name === "string")
        .map((b) => ({
          id: b.id.trim().slice(0, 50),
          name: b.name.trim().slice(0, 120),
          region: typeof b.region === "string" ? b.region.trim().slice(0, 140) : "",
          description:
            typeof b.description === "string"
              ? b.description.trim().slice(0, 500)
              : "",
          address:
            typeof b.address === "string" ? b.address.trim().slice(0, 400) : "",
        }));
    }

    if (Array.isArray(body.servicesOverrides)) {
      update.servicesOverrides = body.servicesOverrides
        .filter((s) => s && typeof s.id === "string" && typeof s.title === "string")
        .map((s) => ({
          id: s.id.trim().slice(0, 80),
          title: s.title.trim().slice(0, 140),
          description:
            typeof s.description === "string"
              ? s.description.trim().slice(0, 500)
              : "",
        }));
    }

    if (Array.isArray(body.projectsOverrides)) {
      update.projectsOverrides = body.projectsOverrides
        .filter((p) => p && typeof p.id === "string" && typeof p.title === "string")
        .map((p) => ({
          id: p.id.trim().slice(0, 80),
          category:
            typeof p.category === "string" ? p.category.trim().slice(0, 140) : "",
          title: p.title.trim().slice(0, 160),
          problem:
            typeof p.problem === "string" ? p.problem.trim().slice(0, 500) : "",
          description:
            typeof p.description === "string"
              ? p.description.trim().slice(0, 500)
              : "",
        }));
    }

    const saved = await SiteContent.findOneAndUpdate(
      { key: "main" },
      { $set: update },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).lean();

    void logAdminActivity({
      admin: req.admin,
      action: "content.updated",
      targetType: "sitecontent",
      summary: "Updated live website content configuration",
    });

    return res.status(200).json({
      success: true,
      message: "Website content saved successfully",
      data: { content: saved },
    });
  } catch (error) {
    console.error("Update admin site content failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save website content",
    });
  }
};

module.exports = {
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
};
