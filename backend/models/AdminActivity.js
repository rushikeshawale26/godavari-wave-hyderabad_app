const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    actorUsername: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      trim: true,
      default: "",
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    collection: "adminactivities",
  }
);

adminActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminActivity", adminActivitySchema);
