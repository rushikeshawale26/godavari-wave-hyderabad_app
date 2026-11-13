require("dotenv").config();

const connectDB = require("../config/db");
const { closePool } = require("../config/postgres");

const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log("PostgreSQL schema initialization completed");
  } catch (error) {
    console.error("PostgreSQL initialization failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

initializeDatabase();
