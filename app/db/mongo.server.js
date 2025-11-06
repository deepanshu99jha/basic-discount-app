// app/db/mongo.server.js
import mongoose from "mongoose";

export async function connectMongo() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState >= 1) {
    return; // Already connected or connecting
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in env");
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || "discount_app",
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Mongo] connected");
  }
}
