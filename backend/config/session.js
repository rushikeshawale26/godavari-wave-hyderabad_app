const session = require("express-session");
const { MongoStore } = require("connect-mongo");

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

  const mongoUrl = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/godavari_wave_hyderabad";
  const store = MongoStore.create({
    mongoUrl,
    collectionName: "sessions",
    ttl: 24 * 60 * 60, // 24 hours server-side document TTL for automatic reaping
    autoRemove: "native",
    touchAfter: 60, // Don't write to DB repeatedly if session was unchanged
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
