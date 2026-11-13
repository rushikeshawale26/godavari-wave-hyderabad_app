const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "sitecontent",
  defaults: {
    key: "main",
    hero: { eyebrow: "", subtitle: "" },
    branches: [],
    servicesOverrides: [],
    projectsOverrides: [],
    updatedBy: "",
  },
  validate(document) {
    requireFields(document, ["key"]);
  },
});
