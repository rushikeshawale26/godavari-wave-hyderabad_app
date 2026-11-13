const { isValidRecordId } = require("../models/postgresModel");
const Admin = require("../models/Admin");
const {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
} = require("../config/session");

const ADMIN_COOKIE_NAME = "gw_admin_token";
const ALLOWED_ADMIN_ROLES = ["admin", "super_admin", "hr_manager", "sales_manager"];
const ROLE_DEFAULT_PERMISSIONS = {
  admin: ["*"],
  super_admin: ["*"],
  hr_manager: ["careers:manage", "chatbot:view"],
  sales_manager: ["leads:manage", "chatbot:view"],
};

const unauthorized = (res, message = "Administrator authentication is required") =>
  res.status(401).json({
    success: false,
    message,
  });

const hasAdminPermission = (admin, permission) =>
  Boolean(
    admin &&
      (admin.role === "admin" ||
        admin.role === "super_admin" ||
        (Array.isArray(admin.permissions) &&
          admin.permissions.includes(permission)))
  );

const adminSessionMiddleware = async (req, res, next) => {
  // Prevent caching of any admin API response to protect sensitive data on logout / browser back
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });

  const adminId = req.session && req.session.adminId;
  if (!isValidRecordId(adminId)) {
    return unauthorized(res);
  }

  try {
    const admin = await Admin.findById(adminId).select(
      "_id username role permissions isActive createdAt"
    );

    if (!admin || !admin.isActive) {
      if (req.session) {
        req.session.destroy(() => {});
      }
      res.clearCookie(ADMIN_SESSION_COOKIE_NAME, getAdminSessionCookieOptions());
      return unauthorized(res, "Administrator account is inactive or no longer exists");
    }

    if (!ALLOWED_ADMIN_ROLES.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access is required",
      });
    }

    const permissions =
      Array.isArray(admin.permissions) && admin.permissions.length > 0
        ? admin.permissions
        : ROLE_DEFAULT_PERMISSIONS[admin.role] || ["chatbot:view"];

    req.admin = {
      _id: admin._id,
      username: admin.username,
      role: admin.role,
      permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
    req.authMeta = {
      sessionId: req.sessionID || null,
      loginTime: req.session?.loginTime || null,
      expiresAt: null,
    };

    return next();
  } catch (error) {
    console.error("Admin session lookup failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to authenticate request",
    });
  }
};

const requireAdminPermission = (permission) => (req, res, next) => {
  if (!req.admin) {
    return unauthorized(res);
  }
  if (hasAdminPermission(req.admin, permission)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Insufficient permissions (${permission} required)`,
  });
};

const requireAnyAdminPermission = (permissions) => (req, res, next) => {
  if (!req.admin) {
    return unauthorized(res);
  }
  if (permissions.some((permission) => hasAdminPermission(req.admin, permission))) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `Insufficient permissions (one of: ${permissions.join(", ")} required)`,
  });
};

module.exports = {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  ALLOWED_ADMIN_ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  adminSessionMiddleware,
  hasAdminPermission,
  requireAnyAdminPermission,
  requireAdminPermission,
};
