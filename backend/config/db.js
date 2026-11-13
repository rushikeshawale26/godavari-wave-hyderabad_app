
const { checkDatabase, initializeSchema } = require("./postgres");

const connectDB = async () => {
  await initializeSchema();
  await checkDatabase();
  console.log("PostgreSQL connected successfully");
};

module.exports = connectDB;
