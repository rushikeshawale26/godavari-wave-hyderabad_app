
const mongoose = require("mongoose");

const enquiryNoteSchema = new mongoose.Schema(
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

const enquirySchema = new mongoose.Schema(
  {
    name: {
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
    company: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "pending", "contacted", "converted", "closed", "resolved"],
      default: "new",
    },
    isPriority: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    source: {
      type: String,
      trim: true,
      default: "Website Contact Form",
    },
    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    notes: {
      type: [enquiryNoteSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "enquiries",
  }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Enquiry", enquirySchema);
