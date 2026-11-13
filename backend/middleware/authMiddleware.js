const jwt = require("jsonwebtoken");
const { isValidRecordId } = require("../models/postgresModel");
const User = require("../models/user");

const unauthorized = (res) =>
  res.status(401).json({
    success: false,
    message: "Authentication is required",
  });

const authMiddleware = async (req, res, next) => {
  const authorization = req.get("authorization");
  const match =
    typeof authorization === "string" &&
    authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return unauthorized(res);
  }
  if (!process.env.JWT_SECRET) {
    console.error("Authentication failed: JWT_SECRET is not configured");
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET);
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return unauthorized(res);
    }

    console.error("Token verification failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to authenticate request",
    });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.userId !== "string" ||
    !isValidRecordId(payload.userId)
  ) {
    return unauthorized(res);
  }

  try {
    const user = await User.findById(payload.userId).select(
      "_id name email role isActive"
    );
    if (!user || !user.isActive) {
      return unauthorized(res);
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
    return next();
  } catch (error) {
    console.error("User authentication lookup failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to authenticate request",
    });
  }
};

module.exports = authMiddleware;
