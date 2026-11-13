const session = require("express-session");
const PostgreSQLStore = require("connect-pg-simple")(session);
const { getPool } = require("./postgres");

const ADMIN_SESSION_COOKIE_NAME = "gw_admin_sid";

const getCookieSameSite = () => {
  const configured = (process.env.COOKIE_SAME_SITE || "").trim().toLowerCase();
  if (configured === "none" || configured === "strict" || configured === "lax") {
    return configured;
  }
  return "lax";
};

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Neither SESSION_SECRET nor JWT_SECRET is configured");
  }
  return secret;
};

const getAdminSessionCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = getCookieSameSite();
  return {
    httpOnly: true,
    secure: isProd || sameSite === "none",
    sameSite,
    path: "/api",
    // Explicitly NO maxAge or expires -> True browser-session cookie
  };
};

let sessionMiddlewareInstance = null;

const createAdminSessionMiddleware = () => {
  if (sessionMiddlewareInstance) {
    return sessionMiddlewareInstance;
  }

  const store =
    process.env.NODE_ENV === "test"
      ? undefined
      : new PostgreSQLStore({
          pool: getPool(),
          tableName: "admin_sessions",
          createTableIfMissing: true,
          ttl: 24 * 60 * 60,
        });

  const cookieOptions = getAdminSessionCookieOptions();

  sessionMiddlewareInstance = session({
    name: ADMIN_SESSION_COOKIE_NAME,
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store,
    proxy: true,
    cookie: cookieOptions,
  });

  return sessionMiddlewareInstance;
};

module.exports = {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionMiddleware,
  getAdminSessionCookieOptions,
};
