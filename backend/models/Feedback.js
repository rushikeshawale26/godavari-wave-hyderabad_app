const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "feedbacks",
  defaults: {
    customerName: "Anonymous",
    email: "",
    serviceRelated: "",
    rating: null,
    status: "pending",
  },
  normalize(document) {
    document.email = String(document.email || "").trim().toLowerCase();
  },
  validate(document) {
    requireFields(document, ["comment"]);
    if (!["pending", "approved", "rejected"].includes(document.status)) {
      throw new Error("Invalid feedback status");
    }
    if (
      document.rating !== null &&
      (typeof document.rating !== "number" || document.rating < 1 || document.rating > 5)
    ) {
      throw new Error("Rating must be between 1 and 5");
    }
  },
});
