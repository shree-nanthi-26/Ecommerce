import axiosInstance from "../api/axiosInstance";

/**
 * Sends a message to the AI Shopping Assistant.
 * Grounded in real MongoDB inventory without hallucinated products.
 *
 * @param {string} message
 * @param {Array} [history=[]]
 * @returns {Promise<{ success: boolean, message: string, products: Array, parsedFilters: object, suggestedQuestions: Array }>}
 */
export async function chatWithAssistant(message, history = []) {
  const response = await axiosInstance.post("/assistant/chat", {
    message,
    history,
  });
  return response.data;
}

/**
 * Retrieves starter conversation prompts.
 *
 * @returns {Promise<{ suggestions: Array<string> }>}
 */
export async function getAssistantSuggestions() {
  const response = await axiosInstance.get("/assistant/suggestions");
  return response.data;
}
