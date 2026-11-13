const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "websitevisitors",
  hiddenFields: ["visitorHash"],
  validate(document) {
    requireFields(document, ["visitorHash", "lastCountedAt", "expiresAt"]);
  },
});
