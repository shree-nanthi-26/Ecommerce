import express from "express";
import rateLimit from "express-rate-limit";
import { chatWithAssistant, getSuggestions } from "../controllers/assistantController.js";

const router = express.Router();

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many assistant queries, please wait a moment." },
  skip: () => process.env.NODE_ENV === "test",
});

router.post("/chat", assistantLimiter, chatWithAssistant);
router.get("/suggestions", getSuggestions);

export default router;
