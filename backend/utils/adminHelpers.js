const AdminActivity = require("../models/AdminActivity");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const csvEscape = (value) => {
  let str = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const logAdminActivity = async ({
  admin,
  action,
  targetType,
  targetId = "",
  summary,
}) => {
  if (!admin?._id || !summary) return;
  try {
    await AdminActivity.create({
      actorId: admin._id,
      actorUsername: admin.username || "admin",
      action,
      targetType,
      targetId: targetId ? String(targetId) : "",
      summary: String(summary).slice(0, 400),
    });
  } catch (error) {
    console.error("Failed to record admin activity:", error.message || error);
  }
};

module.exports = {
  escapeRegex,
  formatDateKey,
  csvEscape,
  logAdminActivity,
};
