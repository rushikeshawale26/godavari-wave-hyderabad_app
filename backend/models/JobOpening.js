const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "jobopenings",
  defaults: {
    location: "Hyderabad",
    jobType: "Full-time",
    experience: "Fresher",
    responsibilities: [],
    requirements: [],
    qualifications: "",
    vacancies: 1,
    deadline: null,
    isActive: true,
  },
  normalize(document) {
    if (typeof document.title === "string") document.title = document.title.trim();
  },
  validate(document) {
    requireFields(document, ["title", "department", "description"]);
    if (!["Full-time", "Part-time", "Internship", "Contract"].includes(document.jobType)) {
      throw new Error("Invalid job type");
    }
    if (
      typeof document.vacancies !== "number" ||
      document.vacancies < 1 ||
      document.vacancies > 500
    ) {
      throw new Error("Vacancies must be between 1 and 500");
    }
  },
});
