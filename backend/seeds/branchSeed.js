require("dotenv").config();

const connectDB = require("../config/db");
const { closePool } = require("../config/postgres");
const Branch = require("../models/Branch");

const branches = [
  {
    city: "Rajahmundry",
    isHeadquarters: true,
    address:
      "3rd Floor,BVR Enclave , Above Yamaha Showroom,Morampudi, Rajamahendravaram,AP 533103.",
    phones: ["+91 7799 822 811", "+91 8688 883 323"],
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    lat: 17.0005,
    lng: 81.804,
    region: "Rajamahendravaram, Andhra Pradesh",
    openTime: "09:00",
    closeTime: "18:00",
    mapPosition: { x: 52, y: 73 },
    order: 1,
  },
  {
    city: "Hyderabad",
    isHeadquarters: false,
    address: "Meenakshi Tech Park, Gachibowli, Hyderabad, Telangana",
    phones: ["+91 7799 822744"],
    imageUrl:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=85",
    lat: 17.385,
    lng: 78.4867,
    region: "Gachibowli, Hyderabad, Telangana",
    openTime: "09:00",
    closeTime: "18:00",
    mapPosition: { x: 44, y: 64 },
    order: 2,
  },
  {
    city: "Visakhapatnam",
    isHeadquarters: false,
    address:
      "KP ICON,opp.MK Gold Coast,Yendada,Visakhapatnam,Andhra Pradesh",
    phones: ["+91 81216 72244"],
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85",
    lat: 17.6868,
    lng: 83.2185,
    region: "Yendada, Visakhapatnam, Andhra Pradesh",
    openTime: "09:00",
    closeTime: "18:00",
    mapPosition: { x: 58, y: 68 },
    order: 3,
  },
  {
    city: "Vijayawada",
    isHeadquarters: false,
    address: "Vijayawada, Andhra Pradesh",
    phones: ["+91 7799 822 811"],
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    lat: 16.5062,
    lng: 80.648,
    region: "Vijayawada, Andhra Pradesh",
    openTime: "09:00",
    closeTime: "18:00",
    mapPosition: { x: 50, y: 70 },
    order: 4,
  },
];

const seedBranches = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed branches");
  }

  await connectDB();

  for (const branch of branches) {
    const result = await Branch.updateOne(
      { city: branch.city },
      { $set: branch },
      { upsert: true, collation: { locale: "en", strength: 2 } }
    );
    console.log(
      `${result.upsertedCount ? "Created" : "Updated"} branch: ${branch.city}`
    );
  }
};

seedBranches()
  .catch((error) => {
    console.error("Branch seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
