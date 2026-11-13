const SiteContent = require("../models/SiteContent");

const getPublicSiteContent = async (_req, res) => {
  try {
    const doc = await SiteContent.findOne({ key: "main" }).lean();
    return res.status(200).json({
      success: true,
      data: {
        content: doc || {
          hero: { eyebrow: "", subtitle: "" },
          branches: [],
          servicesOverrides: [],
          projectsOverrides: [],
        },
      },
    });
  } catch (error) {
    console.error("Load public site content failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load website content",
    });
  }
};

module.exports = { getPublicSiteContent };
