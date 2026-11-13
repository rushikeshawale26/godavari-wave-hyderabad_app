const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "users",
  defaults: {
    role: "user",
    isActive: true,
  },
  hiddenFields: ["password"],
  normalize(document) {
    document.email = String(document.email || "").trim().toLowerCase();
  },
  validate(document) {
    requireFields(document, ["name", "email", "password"]);
    if (document.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    if (!["admin", "user"].includes(document.role)) {
      throw new Error("Invalid user role");
    }
  },
});
