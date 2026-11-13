const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "enquiries",
  defaults: {
    company: "",
    status: "new",
    isPriority: false,
    priority: "medium",
    source: "Website Contact Form",
    assignedTo: "",
    followUpDate: null,
    followUpNote: "",
    notes: [],
  },
  normalize(document) {
    document.email = String(document.email || "").trim().toLowerCase();
  },
  validate(document) {
    requireFields(document, ["name", "email", "phone", "subject", "message"]);
    if (
      !["new", "pending", "contacted", "converted", "closed", "resolved"].includes(
        document.status
      )
    ) {
      throw new Error("Invalid enquiry status");
    }
    if (!["high", "medium", "low"].includes(document.priority)) {
      throw new Error("Invalid enquiry priority");
    }
  },
});
