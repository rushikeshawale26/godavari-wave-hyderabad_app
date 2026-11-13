const mongoose = require("mongoose");

const applicationNoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    addedBy: {
      type: String,
      trim: true,
      default: "Admin",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const jobApplicationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      default: "Fresher",
    },
    education: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    resumeFileName: {
      type: String,
      trim: true,
      default: "",
    },
    resumeStoredPath: {
      type: String,
      default: "",
      select: false,
    },
    resumeMimeType: {
      type: String,
      default: "",
    },
    coverLetter: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "new",
        "pending",
        "reviewed",
        "shortlisted",
        "interview_scheduled",
        "selected",
        "rejected",
      ],
      default: "new",
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: [applicationNoteSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "jobapplications",
  }
);

jobApplicationSchema.index({ createdAt: -1 });
jobApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
