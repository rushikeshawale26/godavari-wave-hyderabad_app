
const mongoose = require("mongoose");

const jobOpeningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "Hyderabad",
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },
    experience: {
      type: String,
      default: "Fresher",
    },
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: String,
      trim: true,
      default: "",
    },
    vacancies: {
      type: Number,
      min: 1,
      max: 500,
      default: 1,
    },
    deadline: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "jobopenings",
  }
);

jobOpeningSchema.index(
  { title: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("JobOpening", jobOpeningSchema);
