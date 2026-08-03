import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";

dotenv.config();

const products = [
  {
    name: "Gaming Laptop Beast X7",
    category: "Laptops",
    price: 79999,
    oldPrice: 94999,
    description:
      "A powerhouse gaming laptop built for immersive performance, high-refresh displays, and all-day productivity.",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.8,
    reviews: 2300,
    stock: 25,
    badge: "NEW",
    brand: "ASUS",
    specs: {
      ram: "16 GB",
      storage: "512 GB SSD",
      screenSize: "15.6 inch",
      processor: "Intel Core i7-13700H",
      os: "Windows 11",
    },
  },
  {
    name: "Wireless Earbuds Pro",
    category: "Audio",
    price: 2499,
    oldPrice: 3999,
    description:
      "Premium wireless earbuds with active noise cancellation, long battery life, and crisp audio clarity.",
    images: [
      "https://images.unsplash.com/photo-1518443474953-7f9a3a24c3a5?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.6,
    reviews: 1100,
    stock: 120,
    badge: "SALE",
    brand: "Sony",
    specs: {},
  },
  {
    name: "Smartwatch Series 5",
    category: "Wearables",
    price: 5999,
    oldPrice: 7999,
    description:
      "A sleek smartwatch with fitness tracking, heart rate monitoring, and seamless smartphone integration.",
    images: [
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviews: 900,
    stock: 80,
    badge: null,
    brand: "Apple",
    specs: {
      screenSize: "1.9 inch",
      os: "watchOS 10",
    },
  },
  {
    name: "4K Action Camera",
    category: "Cameras",
    price: 12499,
    oldPrice: 15999,
    description:
      "Capture every adventure in stunning 4K resolution with rugged design and image stabilization.",
    images: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.5,
    reviews: 540,
    stock: 50,
    badge: "SALE",
    brand: "GoPro",
    specs: {
      storage: "128 GB",
      screenSize: "2.0 inch",
    },
  },
  {
    name: "Ultra OLED Monitor",
    category: "Laptops",
    price: 34999,
    oldPrice: 42999,
    description:
      "A vivid OLED display with high refresh rate and deep contrast, perfect for gaming and creative work.",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.7,
    reviews: 810,
    stock: 35,
    badge: null,
    brand: "LG",
    specs: {
      screenSize: "27 inch",
      processor: "N/A",
    },
  },
  {
    name: "Neon Bluetooth Speaker",
    category: "Speakers",
    price: 3999,
    oldPrice: 5999,
    description:
      "A compact wireless speaker with booming bass, neon accents, and long-lasting playback.",
    images: [
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.4,
    reviews: 660,
    stock: 90,
    badge: "SALE",
    brand: "JBL",
    specs: {},
  },
  {
    name: "Galaxy Fold Phone",
    category: "Mobiles",
    price: 89999,
    oldPrice: 109999,
    description:
      "A flagship foldable phone with premium finish, immersive display, and powerful performance.",
    images: [
      "https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.8,
    reviews: 1550,
    stock: 20,
    badge: "NEW",
    brand: "Samsung",
    specs: {
      ram: "12 GB",
      storage: "256 GB",
      screenSize: "7.6 inch",
      processor: "Snapdragon 8 Gen 2",
      os: "Android 14",
    },
  },
  {
    name: "Studio Headphones X1",
    category: "Audio",
    price: 7999,
    oldPrice: 9999,
    description:
      "Professional studio headphones with balanced sound, wide soundstage, and noise isolation.",
    images: [
      "https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.6,
    reviews: 930,
    stock: 65,
    badge: null,
    brand: "Sennheiser",
    specs: {},
  },
  {
    name: "FitPulse Smart Band",
    category: "Wearables",
    price: 2999,
    oldPrice: 4999,
    description:
      "An affordable fitness band with activity tracking, sleep monitoring, and notification alerts.",
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9dc0bce1?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.3,
    reviews: 740,
    stock: 140,
    badge: "SALE",
    brand: "Xiaomi",
    specs: {
      screenSize: "1.1 inch",
      os: "Proprietary",
    },
  },
  {
    name: "Mirrorless Camera Pro",
    category: "Cameras",
    price: 64999,
    oldPrice: 79999,
    description:
      "A professional mirrorless camera with advanced autofocus, rich color reproduction, and compact design.",
    images: [
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviews: 420,
    stock: 28,
    badge: null,
    brand: "Canon",
    specs: {
      storage: "Dual SD Slot",
      screenSize: "3.2 inch",
    },
  },
  {
    name: "SoundCore Mini Speaker",
    category: "Speakers",
    price: 2499,
    oldPrice: 3499,
    description:
      "A portable mini speaker with crisp sound, bass boost, and splash-resistant design.",
    images: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.2,
    reviews: 590,
    stock: 110,
    badge: "NEW",
    brand: "Anker",
    specs: {},
  },
  {
    name: "Nova Smartphone Lite",
    category: "Mobiles",
    price: 28999,
    oldPrice: 34999,
    description:
      "A powerful budget smartphone with great battery life, vivid display, and fast charging.",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.5,
    reviews: 1210,
    stock: 100,
    badge: null,
    brand: "OnePlus",
    specs: {
      ram: "8 GB",
      storage: "128 GB",
      screenSize: "6.7 inch",
      processor: "MediaTek Dimensity 9000",
      os: "Android 14",
    },
  },
];

async function seedProducts() {
  try {
    await connectDB();
    await Product.deleteMany();
    const processedProducts = products.map((product) => ({
      ...product,
      images: product.images.map((img) => ({ url: img, publicId: "" })),
    }));
    const created = await Product.insertMany(processedProducts);
    console.log(`Seeded ${created.length} products.`);
    process.exit();
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
}

seedProducts();
