const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isValidRecordId } = require("../models/postgresModel");
const User = require("../models/user");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_ROUNDS = 12;

const getUserId = (user) => user && (user.userId || user.id || user._id);

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.statusCode = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
};

const createToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

const publicUser = (user) => {
  const result = user.toObject();
  delete result.password;
  return result;
};

const respondWithError = (res, error, operation) => {
  console.error(`${operation} failed:`, error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode === 500
        ? error.message
        : "An unexpected error occurred",
  });
};

const validateCredentials = ({ email, password }) => {
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    return "A valid email address is required";
  }
  if (typeof password !== "string" || password.length === 0) {
    return "Password is required";
  }
  return null;
};

const authenticate = async (email, password) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid email or password" };
  }
  if (!user.isActive) {
    return { error: "This account is inactive", statusCode: 403 };
  }

  return { user };
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const credentialsError = validateCredentials({ email, password });

    if (typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    if (name.trim().length > 120) {
      return res
        .status(400)
        .json({ success: false, message: "Name must be 120 characters or fewer" });
    }
    if (credentialsError) {
      return res
        .status(400)
        .json({ success: false, message: credentialsError });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    getJwtSecret();
    const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: publicUser(user), token: createToken(user) },
    });
  } catch (error) {
    return respondWithError(res, error, "User registration");
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const credentialsError = validateCredentials({ email, password });

    if (credentialsError) {
      return res
        .status(400)
        .json({ success: false, message: credentialsError });
    }

    const result = await authenticate(email, password);
    if (result.error) {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: publicUser(result.user), token: createToken(result.user) },
    });
  } catch (error) {
    return respondWithError(res, error, "User login");
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication is required" });
    }
    if (!isValidRecordId(userId)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authenticated user" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    return respondWithError(res, error, "Get user profile");
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication is required" });
    }
    if (!isValidRecordId(userId)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authenticated user" });
    }

    const body = req.body || {};
    if (Object.hasOwn(body, "role") || Object.hasOwn(body, "isActive")) {
      return res.status(400).json({
        success: false,
        message: "Role and account status cannot be changed through this endpoint",
      });
    }

    const hasName = Object.hasOwn(body, "name");
    const hasEmail = Object.hasOwn(body, "email");
    const hasPassword = Object.hasOwn(body, "password");
    if (!hasName && !hasEmail && !hasPassword) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one profile field to update",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (hasName) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Name cannot be empty" });
      }
      if (body.name.trim().length > 120) {
        return res
          .status(400)
          .json({ success: false, message: "Name must be 120 characters or fewer" });
      }
      user.name = body.name.trim();
    }

    if (hasEmail) {
      if (typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
        return res
          .status(400)
          .json({ success: false, message: "A valid email address is required" });
      }

      const normalizedEmail = body.email.trim().toLowerCase();
      const duplicate = await User.exists({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
      user.email = normalizedEmail;
    }

    if (hasPassword) {
      if (typeof body.password !== "string" || body.password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 8 characters",
        });
      }
      if (
        typeof body.currentPassword !== "string" ||
        !(await bcrypt.compare(body.currentPassword, user.password))
      ) {
        return res
          .status(401)
          .json({ success: false, message: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(body.password, PASSWORD_ROUNDS);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    return respondWithError(res, error, "Update user profile");
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const credentialsError = validateCredentials({ email, password });

    if (credentialsError) {
      return res
        .status(400)
        .json({ success: false, message: credentialsError });
    }

    const result = await authenticate(email, password);
    if (result.error) {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.error,
      });
    }
    if (result.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Administrator access is required" });
    }

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: { user: publicUser(result.user), token: createToken(result.user) },
    });
  } catch (error) {
    return respondWithError(res, error, "Admin login");
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  adminLogin,
};
