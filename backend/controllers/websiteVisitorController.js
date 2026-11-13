const crypto = require("node:crypto");
const WebsiteVisitor = require("../models/WebsiteVisitor");

const VISITOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_PERIOD_DAYS = 30;
const MAX_PERIOD_DAYS = 3650;

const getPeriodDays = () => {
  const configuredPeriod = process.env.VISITOR_COUNT_PERIOD_DAYS;
  const periodDays =
    configuredPeriod === undefined || configuredPeriod === ""
      ? DEFAULT_PERIOD_DAYS
      : Number(configuredPeriod);

  if (
    !Number.isSafeInteger(periodDays) ||
    periodDays < 1 ||
    periodDays > MAX_PERIOD_DAYS
  ) {
    throw new Error(
      `VISITOR_COUNT_PERIOD_DAYS must be an integer between 1 and ${MAX_PERIOD_DAYS}`
    );
  }

  return periodDays;
};

const getCountSince = (cutoff) =>
  WebsiteVisitor.countDocuments({ lastCountedAt: { $gte: cutoff } });

const getWebsiteVisitorCount = async (_req, res) => {
  try {
    const periodDays = getPeriodDays();
    const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const count = await getCountSince(cutoff);
    return res.status(200).json({
      success: true,
      data: { count, periodDays },
    });
  } catch (error) {
    console.error("Get website visitor count failed:", error);
    return res.status(500).json({
      success: false,
      message: "The website visitor count is temporarily unavailable",
    });
  }
};

const recordWebsiteVisitor = async (req, res) => {
  const { visitorId } = req.body || {};
  if (typeof visitorId !== "string" || !VISITOR_ID_PATTERN.test(visitorId)) {
    return res.status(400).json({
      success: false,
      message: "A valid anonymous visitor ID is required",
    });
  }

  try {
    const periodDays = getPeriodDays();
    const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    if (process.env.NODE_ENV !== "production") {
      const count = await getCountSince(cutoff);
      return res.status(200).json({
        success: true,
        data: { count, periodDays, trackingEnabled: false },
      });
    }

    const hashSecret = process.env.VISITOR_ID_HASH_SECRET;
    if (!hashSecret) {
      return res.status(503).json({
        success: false,
        message: "Website visitor tracking is not configured",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
    const visitorHash = crypto
      .createHmac("sha256", hashSecret)
      .update(visitorId)
      .digest("hex");
    let counted = false;

    try {
      await WebsiteVisitor.create({ visitorHash, lastCountedAt: now, expiresAt });
      counted = true;
    } catch (error) {
      if (error.code !== 11000) throw error;

      const update = await WebsiteVisitor.updateOne(
        { visitorHash, lastCountedAt: { $lt: cutoff } },
        { $set: { lastCountedAt: now, expiresAt } }
      );
      counted = update.modifiedCount === 1;
    }

    const count = await getCountSince(cutoff);
    return res.status(200).json({
      success: true,
      data: { count, periodDays, counted },
    });
  } catch (error) {
    console.error("Record website visitor failed:", error);
    return res.status(500).json({
      success: false,
      message: "The website visitor count is temporarily unavailable",
    });
  }
};

module.exports = { getWebsiteVisitorCount, recordWebsiteVisitor };
