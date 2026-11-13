const { isValidRecordId } = require("../models/postgresModel");
const Branch = require("../models/Branch");

const editableFields = [
  "city",
  "isHeadquarters",
  "address",
  "phones",
  "imageUrl",
  "lat",
  "lng",
  "region",
  "openTime",
  "closeTime",
  "mapPosition",
  "isActive",
  "order",
];

const getValidatedBody = (body) =>
  Object.fromEntries(
    editableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );

const getBranches = async (req, res) => {
  try {
    const filter = { isActive: true };
    const region =
      typeof req.query.region === "string" ? req.query.region.trim() : "";

    if (region) {
      const escapedRegion = region.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.region = new RegExp(`^${escapedRegion}$`, "i");
    }

    const branches = await Branch.find(filter).sort({ order: 1, city: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: branches,
      message: "Branches loaded",
    });
  } catch (error) {
    console.error("Load branches failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Unable to load branches",
    });
  }
};

const getBranchById = async (req, res) => {
  if (!isValidRecordId(req.params.id)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid branch id",
    });
  }

  try {
    const branch = await Branch.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!branch) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: branch,
      message: "Branch loaded",
    });
  } catch (error) {
    console.error("Load branch failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Unable to load branch",
    });
  }
};

const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(getValidatedBody(req.body));
    return res.status(201).json({
      success: true,
      data: branch,
      message: "Branch created",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        data: null,
        message: "A headquarters branch already exists",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.message,
      });
    }
    console.error("Create branch failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Unable to create branch",
    });
  }
};

const updateBranch = async (req, res) => {
  if (!isValidRecordId(req.params.id)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid branch id",
    });
  }

  const updates = getValidatedBody(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "At least one valid branch field is required",
    });
  }

  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: branch,
      message: "Branch updated",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        data: null,
        message: "A headquarters branch already exists",
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.message,
      });
    }
    console.error("Update branch failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Unable to update branch",
    });
  }
};

const deleteBranch = async (req, res) => {
  if (!isValidRecordId(req.params.id)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid branch id",
    });
  }

  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: branch._id },
      message: "Branch deleted",
    });
  } catch (error) {
    console.error("Delete branch failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Unable to delete branch",
    });
  }
};

module.exports = {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  updateBranch,
};
