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
import { wafMiddleware } from "./middleware/waf.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Trust reverse proxy / load balancer headers (Render, Cloudflare, AWS ALB)
app.set("trust proxy", 1);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
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
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Furniva E-Commerce API is running" });
});

app.use(errorHandler);

export default app;
