import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("[MongoDB] FATAL: MONGO_URI environment variable is missing.");
    process.exit(1);
  }

  const options = {
    // Atlas & multi-instance connection pooling
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || "50", 10),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || "10", 10),
    maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS || "30000", 10),
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Disable auto-indexing in production to prevent startup latency spikes
    autoIndex: process.env.NODE_ENV !== "production",
  };

  try {
    const conn = await mongoose.connect(mongoUri, options);
    console.log(`[MongoDB] Connected to Atlas/Cluster: ${conn.connection.host} (DB: ${conn.connection.name})`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Runtime connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Connection disconnected. Attempting reconnection...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[MongoDB] Connection re-established.");
    });
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed: ${error.message}`);
    process.exit(1);
  }
}

// Graceful cleanup for PM2 / container termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("[MongoDB] Connection closed through app termination");
  } catch (err) {
    console.error("[MongoDB] Error during disconnect:", err);
  }
});

