import express from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  unsubscribeUser,
  getEmailPreferences,
  updateEmailPreferences,
  changePassword,
  validate2FALogin,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getActiveSessions,
  revokeSession,
  logoutAllSessions,
  logoutOtherSessions,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/register/reset attempts from this IP, please try again after 15 minutes." },
  skip: () => process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development",
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  handler: (req, res, next, options) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.connection?.remoteAddress || "127.0.0.1";
    import("../models/AttackLog.js").then(({ default: AttackLog }) => {
      AttackLog.create({
        ip,
        userAgent: req.headers["user-agent"] || "",
        method: req.method,
        url: req.originalUrl,
        attackType: "Rate Limit Exceeded",
        severity: 7,
        details: `Client exceeded auth endpoint rate limit (${options.max} attempts/15m)`,
        payload: {
          path: req.originalUrl,
          method: req.method,
        },
      }).catch((err) => console.error("Auth rate limit log error:", err));
    }).catch(() => {});

    res.status(options.statusCode).json(options.message);
  },
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/me", protect, getMe);

// Account Security: Password Change & 2FA
router.post("/change-password", protect, changePassword);
router.post("/2fa/validate-login", authLimiter, validate2FALogin);
router.post("/2fa/setup", protect, setup2FA);
router.post("/2fa/verify-setup", protect, verify2FASetup);
router.post("/2fa/disable", protect, disable2FA);

// Active Session Management
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.post("/logout-all", protect, logoutAllSessions);
router.post("/logout-others", protect, logoutOtherSessions);

// Email Preferences & Opt-Out Routes
router.get("/unsubscribe", unsubscribeUser);
router.post("/unsubscribe", unsubscribeUser);
router.get("/preferences", protect, getEmailPreferences);
router.put("/preferences", protect, updateEmailPreferences);

// Password Reset & Email Verification Routes
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, authLimiter, resendVerification);

export default router;
