const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "adminactivities",
  timestamps: false,
  normalize(document) {
    document.actorUsername = String(document.actorUsername || "").trim();
    document.action = String(document.action || "").trim();
    document.targetType = String(document.targetType || "").trim();
    document.summary = String(document.summary || "").trim();
  },
  validate(document) {
    requireFields(document, [
      "actorId",
      "actorUsername",
      "action",
      "targetType",
      "summary",
    ]);
    if (document.summary.length > 400) {
      throw new Error("Summary must be 400 characters or fewer");
    }
  },
});
