import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testMongoUri = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/furniva_test";
process.env.MONGO_URI = testMongoUri;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_furniva_sprint";
process.env.NODE_ENV = "test";

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testMongoUri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.db.dropDatabase();
    } catch (e) {
      // Ignore database drop errors if any
    }
    await mongoose.connection.close();
  }
});
