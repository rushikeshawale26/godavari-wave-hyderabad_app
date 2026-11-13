const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "branches",
  defaults: {
    isHeadquarters: false,
    phones: [],
    isActive: true,
    order: 0,
  },
  validate(document) {
    requireFields(document, [
      "city",
      "address",
      "imageUrl",
      "lat",
      "lng",
      "region",
      "openTime",
      "closeTime",
      "mapPosition",
    ]);
    if (
      typeof document.lat !== "number" ||
      document.lat < -90 ||
      document.lat > 90 ||
      typeof document.lng !== "number" ||
      document.lng < -180 ||
      document.lng > 180
    ) {
      throw new Error("Branch coordinates are invalid");
    }
    if (
      !document.mapPosition ||
      typeof document.mapPosition.x !== "number" ||
      document.mapPosition.x < 0 ||
      document.mapPosition.x > 100 ||
      typeof document.mapPosition.y !== "number" ||
      document.mapPosition.y < 0 ||
      document.mapPosition.y > 100
    ) {
      throw new Error("Branch map position is invalid");
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(document.openTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(document.closeTime)) {
      throw new Error("Branch hours must use HH:MM format");
    }
    if (!Array.isArray(document.phones) || !document.phones.every((phone) => typeof phone === "string")) {
      throw new Error("Branch phones must be an array of strings");
    }
  },
});
