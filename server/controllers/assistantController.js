import { getShoppingAdvice } from "../services/aiShoppingAssistantService.js";

/**
 * POST /api/assistant/chat
 * Handles shopping inquiries by querying real MongoDB products and generating grounded advice.
 */
export async function chatWithAssistant(req, res, next) {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message or question about furniture.",
      });
    }

    const advice = await getShoppingAdvice(message.trim(), history);

    res.json({
      success: true,
      message: advice.message,
      products: advice.products,
      parsedFilters: advice.parsedFilters,
      suggestedQuestions: advice.suggestedQuestions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/assistant/suggestions
 * Returns suggested shopping prompts for the assistant UI.
 */
export async function getSuggestions(req, res) {
  res.json({
    suggestions: [
      "I need a modern sofa for a small living room under ₹30,000",
      "Show solid wood dining tables with seating for 6",
      "Looking for a queen bed with storage under ₹40,000",
      "Compact ergonomic office chairs under ₹15,000",
      "Show bestselling coffee tables in walnut finish",
    ],
  });
}
