import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./config/redis.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import adminCouponRoutes from "./routes/adminCouponRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import AttackLog from "./models/AttackLog.js";
import { wafMiddleware } from "./middleware/waf.js";
import errorHandler from "./middleware/errorHandler.js";
import Product from "./models/Product.js";

const app = express();

// Trust reverse proxy / load balancer headers (Render, Cloudflare, AWS ALB)
app.set("trust proxy", 1);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  skip: () => process.env.NODE_ENV === "development",
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  handler: (req, res, next, options) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.connection?.remoteAddress || "127.0.0.1";
    AttackLog.create({
      ip,
      userAgent: req.headers["user-agent"] || "",
      method: req.method,
      url: req.originalUrl,
      attackType: "Rate Limit Exceeded",
      severity: 6,
      details: `Client exceeded global API request threshold (${options.max} reqs/15m)`,
      payload: {
        method: req.method,
        path: req.originalUrl,
      },
    }).catch((err) => console.error("Rate limit log error:", err));

    res.status(options.statusCode).json(options.message);
  },
});

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(generalLimiter);
app.use(morgan("dev"));
app.use(wafMiddleware);

// ── Health Check Endpoint (Probes & Load Balancers) ──────────────────────────
app.get("/api/health", async (req, res) => {
  let mongoStatus = "disconnected";
  let redisStatus = "disconnected";

  try {
    const { default: mongoose } = await import("mongoose");
    mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "degraded";
  } catch {
    mongoStatus = "error";
  }

  try {
    const ping = await redis.ping();
    redisStatus = ping === "PONG" ? "connected" : "degraded";
  } catch {
    redisStatus = "error";
  }

  const isHealthy = mongoStatus === "connected" && redisStatus === "connected";
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/admin/inventory", inventoryRoutes);
app.use("/api/admin", adminRoutes);



// ── SEO Endpoints (Robots & Dynamic Sitemap) ──────────────────────────────────
app.get("/robots.txt", (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "https://furniva.vercel.app";
  res.type("text/plain").send(`User-agent: *
Allow: /
Allow: /products
Allow: /categories
Allow: /deals
Allow: /compare
Allow: /support
Allow: /track-order
Allow: /warranty-returns
Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /profile
Disallow: /orders
Disallow: /addresses
Disallow: /notifications
Disallow: /reset-password/*
Disallow: /verify-email/*
Disallow: /unsubscribe/*

Sitemap: ${clientUrl}/sitemap.xml
`);
});

app.get("/sitemap.xml", async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || "https://furniva.vercel.app";
    const products = await Product.find({}, "_id updatedAt category name").lean();

    const staticUrls = [
      { loc: `${clientUrl}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${clientUrl}/products`, priority: "0.9", changefreq: "daily" },
      { loc: `${clientUrl}/categories`, priority: "0.8", changefreq: "weekly" },
      { loc: `${clientUrl}/deals`, priority: "0.8", changefreq: "daily" },
      { loc: `${clientUrl}/compare`, priority: "0.6", changefreq: "weekly" },
      { loc: `${clientUrl}/support`, priority: "0.5", changefreq: "monthly" },
      { loc: `${clientUrl}/warranty-returns`, priority: "0.5", changefreq: "monthly" },
      { loc: `${clientUrl}/track-order`, priority: "0.4", changefreq: "monthly" },
    ];

    const categoryUrls = [
      "Sofas & Seating",
      "Beds & Bedroom",
      "Dining Furniture",
      "Living Room",
      "Tables & Desks",
      "Storage & Cabinets",
    ].map((cat) => ({
      loc: `${clientUrl}/products?category=${encodeURIComponent(cat)}`,
      priority: "0.8",
      changefreq: "daily",
    }));

    const productUrls = (products || []).map((p) => ({
      loc: `${clientUrl}/products/${p._id}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      priority: "0.8",
      changefreq: "weekly",
    }));

    const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.type("application/xml").send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Furniva E-Commerce API is running" });
});

app.use(errorHandler);

export default app;
