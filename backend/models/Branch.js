const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isHeadquarters: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    phones: {
      type: [{ type: String, trim: true, maxlength: 32 }],
      default: [],
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    openTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    closeTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    mapPosition: {
      x: { type: Number, required: true, min: 0, max: 100 },
      y: { type: Number, required: true, min: 0, max: 100 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "branches",
  }
);

branchSchema.index(
  { isHeadquarters: 1 },
  { unique: true, partialFilterExpression: { isHeadquarters: true } }
);

module.exports = mongoose.model("Branch", branchSchema);
