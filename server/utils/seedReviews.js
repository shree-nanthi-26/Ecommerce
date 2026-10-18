import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

dotenv.config();

async function seedSampleReviews() {
  try {
    await connectDB();

    // Find or create sample customer users
    let user1 = await User.findOne({ email: "priya.nair@example.com" });
    if (!user1) {
      user1 = await User.create({
        name: "Priya Nair",
        email: "priya.nair@example.com",
        password: "password123",
        role: "customer",
        isVerified: true,
      });
    }

    let user2 = await User.findOne({ email: "rohit.mehta@example.com" });
    if (!user2) {
      user2 = await User.create({
        name: "Rohit Mehta",
        email: "rohit.mehta@example.com",
        password: "password123",
        role: "customer",
        isVerified: true,
      });
    }

    let user3 = await User.findOne({ email: "ananya.sharma@example.com" });
    if (!user3) {
      user3 = await User.create({
        name: "Ananya Sharma",
        email: "ananya.sharma@example.com",
        password: "password123",
        role: "customer",
        isVerified: true,
      });
    }

    const osloSofa = await Product.findOne({ name: /Oslo/i });
    if (osloSofa) {
      await Review.deleteMany({ product: osloSofa._id });

      await Review.create([
        {
          user: user1._id,
          product: osloSofa._id,
          rating: 5,
          title: "Exquisite Scandinavian aesthetics and pure comfort!",
          comment:
            "We ordered the Oslo 3-seater for our new apartment in Bengaluru. The oatmeal beige fabric feels very durable and soft to touch. Delivery was prompt and carpenter assembly was completed in 15 minutes.",
          images: [
            {
              url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
              publicId: "",
            },
            {
              url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80",
              publicId: "",
            },
          ],
          verifiedPurchase: true,
          helpfulCount: 8,
          helpfulUsers: [user2._id, user3._id],
        },
        {
          user: user2._id,
          product: osloSofa._id,
          rating: 5,
          title: "Solid pine wood structure, very sturdy!",
          comment:
            "Firm yet welcoming cushion support. Tapered wooden legs are beautifully finished and the elevation allows easy robotic vacuum cleaning underneath.",
          images: [],
          verifiedPurchase: true,
          helpfulCount: 4,
          helpfulUsers: [user1._id],
        },
        {
          user: user3._id,
          product: osloSofa._id,
          rating: 4,
          title: "Great value for money, highly recommend",
          comment:
            "Color matches the website photos accurately. The back cushions provide good posture support. Overall a 5-star build quality with slight delivery delay of 1 day.",
          images: [],
          verifiedPurchase: true,
          helpfulCount: 2,
          helpfulUsers: [],
        },
      ]);

      // Calculate aggregate rating
      const stats = await Review.aggregate([
        { $match: { product: osloSofa._id } },
        {
          $group: {
            _id: "$product",
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        await Product.findByIdAndUpdate(osloSofa._id, {
          rating: Number(stats[0].avgRating.toFixed(1)),
          reviews: stats[0].totalReviews,
        });
      }
    }

    console.log("Successfully seeded sample customer reviews!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed reviews:", error.message);
    process.exit(1);
  }
}

seedSampleReviews();
