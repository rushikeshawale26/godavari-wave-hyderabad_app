require("dotenv").config();

const connectDB = require("../config/db");
const { closePool } = require("../config/postgres");
const JobOpening = require("../models/JobOpening");

const openings = [
  {
    title: "Full Stack Developer",
    department: "Engineering",
    location: "Hyderabad",
    jobType: "Full-time",
    experience: "Fresher",
    description:
      "Contribute to web application features across frontend and backend, from implementation through testing and maintenance.",
  },
  {
    title: "MERN Stack Developer",
    department: "Engineering",
    location: "Hyderabad",
    jobType: "Full-time",
    experience: "Fresher",
    description:
      "Build and maintain web application features using MongoDB, Express.js, React, and Node.js.",
  },
  {
    title: "Graphic Designer",
    department: "Design",
    location: "Hyderabad",
    jobType: "Full-time",
    experience: "Fresher",
    description:
      "Create clear, consistent digital graphics and visual assets for website and marketing needs.",
  },
];

const seedJobOpenings = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed job openings");
  }

  await connectDB();

  for (const opening of openings) {
    const result = await JobOpening.updateOne(
      { title: opening.title },
      { $setOnInsert: opening },
      {
        upsert: true,
        collation: { locale: "en", strength: 2 },
      }
    );
    const action = result.upsertedCount === 1 ? "Created" : "Already exists";
    console.log(`${action}: ${opening.title}`);
  }
};

seedJobOpenings()
  .catch((error) => {
    console.error("Job-opening seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
