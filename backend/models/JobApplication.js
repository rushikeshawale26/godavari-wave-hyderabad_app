const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "jobapplications",
  defaults: {
    experience: "Fresher",
    education: "",
    address: "",
    resumeUrl: "",
    resumeFileName: "",
    resumeStoredPath: "",
    resumeMimeType: "",
    coverLetter: "",
    status: "new",
    interviewDate: null,
    notes: [],
  },
  hiddenFields: ["resumeStoredPath"],
  normalize(document) {
    document.email = String(document.email || "").trim().toLowerCase();
  },
  validate(document) {
    requireFields(document, ["fullName", "email", "phone", "position"]);
    if (
      ![
        "new",
        "pending",
        "reviewed",
        "shortlisted",
        "interview_scheduled",
        "selected",
        "rejected",
      ].includes(document.status)
    ) {
      throw new Error("Invalid application status");
    }
  },
});
