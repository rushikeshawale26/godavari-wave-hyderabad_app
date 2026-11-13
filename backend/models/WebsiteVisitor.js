const mongoose = require("mongoose");

const websiteVisitorSchema = new mongoose.Schema(
  {
    visitorHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    lastCountedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "websitevisitors",
  }
);

websiteVisitorSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("WebsiteVisitor", websiteVisitorSchema);
