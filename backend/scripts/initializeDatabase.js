
require("dotenv").config();

const mongoose = require("mongoose");

const collections = [
  "users",
  "admins",
  "enquiries",
  "jobapplications",
  "jobopenings",
  "websitevisitors",
  "chatconversations",
  "feedbacks",
  "sitecontent",
  "adminactivities",
];

const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    const db = mongoose.connection.db;

    const existingCollections = await db
      .listCollections()
      .toArray();

    const existingNames = existingCollections.map(
      (collection) => collection.name
    );

    for (const collectionName of collections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`Created: ${collectionName}`);
      } else {
        console.log(`Already exists: ${collectionName}`);
      }
    }

    // Create indexes
    await db.collection("users").createIndex(
      { email: 1 },
      { unique: true }
    );

    await db.collection("admins").createIndex(
      { username: 1 },
      { unique: true }
    );

    await db.collection("chatconversations").createIndex(
      { sessionId: 1 },
      { unique: true }
    );

    await db.collection("chatconversations").createIndex({
      lastMessageAt: -1,
    });

    await db.collection("feedbacks").createIndex({
      createdAt: -1,
    });

    await db.collection("sitecontent").createIndex(
      { key: 1 },
      { unique: true }
    );

    await db.collection("adminactivities").createIndex({
      createdAt: -1,
    });

    await db.collection("enquiries").createIndex({
      createdAt: -1,
    });

    await db.collection("jobapplications").createIndex({
      createdAt: -1,
    });

    await db.collection("jobopenings").createIndex({
      isActive: 1,
    });

    await db.collection("jobopenings").createIndex(
      { title: 1 },
      {
        unique: true,
        collation: { locale: "en", strength: 2 },
      }
    );

    await db.collection("websitevisitors").createIndex(
      { visitorHash: 1 },
      { unique: true }
    );

    await db.collection("websitevisitors").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    console.log("Database initialization completed!");
  } catch (error) {
    console.error("Database initialization error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

initializeDatabase();
