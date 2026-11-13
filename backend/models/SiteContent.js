const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },
    hero: {
      eyebrow: { type: String, trim: true, default: "" },
      subtitle: { type: String, trim: true, default: "" },
    },
    branches: {
      type: [
        {
          id: { type: String, required: true, trim: true },
          name: { type: String, required: true, trim: true },
          region: { type: String, trim: true, default: "" },
          description: { type: String, trim: true, default: "" },
          address: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    servicesOverrides: {
      type: [
        {
          id: { type: String, required: true, trim: true },
          title: { type: String, required: true, trim: true },
          description: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    projectsOverrides: {
      type: [
        {
          id: { type: String, required: true, trim: true },
          category: { type: String, trim: true, default: "" },
          title: { type: String, required: true, trim: true },
          problem: { type: String, trim: true, default: "" },
          description: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    updatedBy: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "sitecontent",
  }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
