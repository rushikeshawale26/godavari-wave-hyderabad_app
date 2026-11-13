const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "admins",
  defaults: {
    role: "admin",
    permissions: ["*"],
    isActive: true,
  },
  hiddenFields: ["passwordHash"],
  normalize(document) {
    if (typeof document.username === "string") {
      document.username = document.username.trim().toLowerCase();
    }
  },
  validate(document) {
    requireFields(document, ["username", "passwordHash", "role"]);
    if (document.username.length < 3 || document.username.length > 80) {
      throw new Error("Username must be between 3 and 80 characters");
    }
    if (!["admin", "super_admin", "hr_manager", "sales_manager"].includes(document.role)) {
      throw new Error("Invalid administrator role");
    }
  },
});
