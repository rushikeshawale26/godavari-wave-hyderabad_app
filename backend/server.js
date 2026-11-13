const path = require("node:path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
  quiet: true,
});

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const { checkDatabase } = require("./config/postgres");
const userRoutes = require("./routes/userRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");
const jobOpeningRoutes = require("./routes/jobOpeningRoutes");
const chatRoutes = require("./routes/chatRoutes");
const websiteVisitorRoutes = require("./routes/websiteVisitorRoutes");
const contentRoutes = require("./routes/contentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const branchRoutes = require("./routes/branchRoutes");

const app = express();
const trustProxyHops = Number(process.env.TRUST_PROXY);
app.set(
  "trust proxy",
  Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1
);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  "/api/job-applications",
  express.json({ limit: "5mb" }),
  jobApplicationRoutes
);
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", async (_req, res) => {
  try {
    await checkDatabase();
    return res.status(200).json({
      success: true,
      status: "ok",
      db: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch {
    return res.status(503).json({
      success: false,
      status: "degraded",
      db: "disconnected",
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }
});
app.use("/api/users", userRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/job-openings", jobOpeningRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/website-visitors", websiteVisitorRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/admin", adminRoutes);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);
app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON request body" });
  }
  if (err && err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ success: false, message: "Request payload exceeds size limit" });
  }
  console.error("Unhandled Express error:", err?.message || err);
  return res
    .status(err?.statusCode || 500)
    .json({ success: false, message: "An unexpected server error occurred" });
});

const startServer = async () => {
  await connectDB();

  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exitCode = 1;
  });
}

module.exports = app;