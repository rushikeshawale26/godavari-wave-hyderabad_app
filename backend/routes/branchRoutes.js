const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  updateBranch,
} = require("../controllers/branchController");
const {
  adminSessionMiddleware,
  requireAdminPermission,
} = require("../middleware/adminSessionMiddleware");
const { createAdminSessionMiddleware } = require("../config/session");

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: errors.array()[0].msg,
    });
  }
  return next();
};

const branchFields = (optional = false) => [
  body("city")
    [optional ? "optional" : "exists"]()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),
  body("isHeadquarters").optional().isBoolean().toBoolean(),
  body("address")
    [optional ? "optional" : "exists"]()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 500 }),
  body("phones").optional().isArray({ max: 5 }),
  body("phones.*").optional().isString().trim().isLength({ min: 1, max: 32 }),
  body("imageUrl")
    [optional ? "optional" : "exists"]()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .isLength({ max: 2048 }),
  body("lat")
    [optional ? "optional" : "exists"]()
    .isFloat({ min: -90, max: 90 })
    .toFloat(),
  body("lng")
    [optional ? "optional" : "exists"]()
    .isFloat({ min: -180, max: 180 })
    .toFloat(),
  body("region")
    [optional ? "optional" : "exists"]()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),
  body("openTime")
    [optional ? "optional" : "exists"]()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body("closeTime")
    [optional ? "optional" : "exists"]()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body("mapPosition")
    [optional ? "optional" : "exists"]()
    .isObject()
    .custom((value) => {
      if (
        !value ||
        !Number.isFinite(Number(value.x)) ||
        !Number.isFinite(Number(value.y)) ||
        Number(value.x) < 0 ||
        Number(value.x) > 100 ||
        Number(value.y) < 0 ||
        Number(value.y) > 100
      ) {
        throw new Error("Map position x and y must be percentages from 0 to 100");
      }
      return true;
    }),
  body("isActive").optional().isBoolean().toBoolean(),
  body("order").optional().isInt({ min: 0 }).toInt(),
];

const adminWriters = [
  createAdminSessionMiddleware(),
  adminSessionMiddleware,
  requireAdminPermission("content:manage"),
];

router.get(
  "/",
  query("region").optional().isString().trim().isLength({ max: 100 }),
  validateRequest,
  getBranches
);
router.get("/:id", param("id").isMongoId(), validateRequest, getBranchById);
router.post(
  "/",
  ...adminWriters,
  branchFields(),
  validateRequest,
  createBranch
);
router.put(
  "/:id",
  ...adminWriters,
  param("id").isMongoId(),
  ...branchFields(true),
  validateRequest,
  updateBranch
);
router.patch(
  "/:id",
  ...adminWriters,
  param("id").isMongoId(),
  ...branchFields(true),
  validateRequest,
  updateBranch
);
router.delete(
  "/:id",
  ...adminWriters,
  param("id").isMongoId(),
  validateRequest,
  deleteBranch
);

module.exports = router;
