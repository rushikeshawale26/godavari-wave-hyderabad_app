const path = require("node:path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const { closePool } = require("../config/postgres");
const Admin = require("../models/Admin");

const PASSWORD_ROUNDS = 12;

const seedAdmin = async () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL is required in backend/.env");
    process.exitCode = 1;
    return;
  }

  if (!username || username.length < 3 || username.length > 80) {
    console.error(
      "Error: ADMIN_USERNAME (3-80 characters) must be configured in backend/.env"
    );
    process.exitCode = 1;
    return;
  }

  if (typeof password !== "string" || password.length < 8) {
    console.error(
      "Error: ADMIN_PASSWORD (at least 8 characters) must be configured in backend/.env"
    );
    process.exitCode = 1;
    return;
  }

  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({ username }).select("_id username");
    if (existingAdmin) {
      console.log(
        `Admin account "${existingAdmin.username}" already exists in PostgreSQL. Skipping duplicate seed.`
      );
      return;
    }

    const totalAdmins = await Admin.countDocuments();
    if (totalAdmins > 0 && process.env.ALLOW_ADDITIONAL_ADMIN !== "true") {
      console.log(
        `An initial admin account already exists (${totalAdmins} found in PostgreSQL). Set ALLOW_ADDITIONAL_ADMIN=true in env only if provisioning an extra admin intentionally.`
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
    await Admin.create({
      username,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log(
      `Successfully created initial admin "${username}" in PostgreSQL.`
    );
  } catch (error) {
    if (error.code === 11000) {
      console.log(
        `Admin account "${username}" already exists (unique index prevented duplicate).`
      );
      return;
    }
    console.error("Failed to seed admin account:", error.message || error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

seedAdmin();
