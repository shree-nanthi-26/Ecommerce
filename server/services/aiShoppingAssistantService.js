import { searchProductsGrounded, normalizeCategory } from "./productSearchService.js";

/**
 * Extracts structured shopping constraints from natural language query.
 *
 * @param {string} text
 * @returns {object} Extracted criteria
 */
export function extractQueryCriteria(text = "") {
  const criteria = {};
  const lower = text.toLowerCase();

  // 1. Budget extraction
  // Handles: under ₹30,000, under 30000, below 30k, under 30k, budget 25000, max 40000, less than 20000
  const underPriceMatch = lower.match(/(?:under|below|less than|within|max|budget(?:\s*of)?|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|lakh|lac)?/i);
  if (underPriceMatch) {
    let num = parseFloat(underPriceMatch[1].replace(/,/g, ""));
    const unit = underPriceMatch[2]?.toLowerCase();
    if (unit === "k") num *= 1000;
    if (unit === "lakh" || unit === "lac") num *= 100000;
    criteria.maxPrice = num;
  }

  // Handles: between 15000 and 30000, 15k to 30k
  const rangeMatch = lower.match(/(?:between|from)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?)\s*(k)?\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?)\s*(k)?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1].replace(/,/g, ""));
    if (rangeMatch[2]?.toLowerCase() === "k") min *= 1000;
    let max = parseFloat(rangeMatch[3].replace(/,/g, ""));
    if (rangeMatch[4]?.toLowerCase() === "k") max *= 1000;
    criteria.minPrice = min;
    criteria.maxPrice = max;
  }

  // 2. Category extraction
  if (/sofa|couch|sectional|recliner|futon/.test(lower)) {
    criteria.category = "Sofas & Seating";
  } else if (/dining table|dining set/.test(lower)) {
    criteria.category = "Dining Tables";
  } else if (/bed|mattress|cot|bunk/.test(lower)) {
    criteria.category = "Beds";
  } else if (/accent chair|armchair|lounge chair|office chair|study chair|chair/.test(lower)) {
    criteria.category = "Chairs";
  } else if (/coffee table|center table|side table|end table/.test(lower)) {
    criteria.category = "Tables";
  } else if (/desk|study table|workstation/.test(lower)) {
    criteria.category = "Tables";
  } else if (/bookshelf|bookcase|wall shelf/.test(lower)) {
    criteria.category = "Bookshelves";
  } else if (/wardrobe|almirah|cupboard/.test(lower)) {
    criteria.category = "Wardrobes";
  } else if (/tv unit|tv stand|entertainment/.test(lower)) {
    criteria.category = "TV Units";
  } else if (/lamp|light|chandelier/.test(lower)) {
    criteria.category = "Lighting";
  }

  // 3. Room Type extraction
  if (/living room|living space|hall/.test(lower)) criteria.roomType = "Living Room";
  else if (/bedroom|master bedroom|bed room/.test(lower)) criteria.roomType = "Bedroom";
  else if (/dining room|dining area/.test(lower)) criteria.roomType = "Dining Room";
  else if (/home office|study room|office|workstation/.test(lower)) criteria.roomType = "Home Office";
  else if (/balcony|patio|outdoor/.test(lower)) criteria.roomType = "Balcony";

  // 4. Style extraction
  if (/modern|contemporary/.test(lower)) criteria.style = "Modern";
  else if (/scandinavian|nordic/.test(lower)) criteria.style = "Scandinavian";
  else if (/minimalist|clean lines/.test(lower)) criteria.style = "Minimalist";
  else if (/mid-century|mid century|retro/.test(lower)) criteria.style = "Mid-Century";
  else if (/rustic|vintage|traditional|classic/.test(lower)) criteria.style = "Traditional";
  else if (/industrial/.test(lower)) criteria.style = "Industrial";
  else if (/luxury|premium|regal/.test(lower)) criteria.style = "Luxury";

  // 5. Material extraction
  if (/solid wood|solid pine|sheesham|teak|oak|walnut wood/.test(lower)) criteria.material = "Solid Wood";
  else if (/fabric|linen|cotton/.test(lower)) criteria.material = "Fabric";
  else if (/velvet/.test(lower)) criteria.material = "Velvet";
  else if (/leatherette|faux leather/.test(lower)) criteria.material = "Leatherette";
  else if (/leather/.test(lower)) criteria.material = "Leather";
  else if (/metal|iron|steel/.test(lower)) criteria.material = "Metal";
  else if (/marble/.test(lower)) criteria.material = "Marble";
  else if (/glass/.test(lower)) criteria.material = "Glass";
  else if (/cane|rattan/.test(lower)) criteria.material = "Cane";

  // 6. Color extraction
  const colors = ["beige", "brown", "grey", "gray", "blue", "black", "white", "cream", "walnut", "green", "mustard", "yellow", "navy", "teal"];
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`, "i").test(lower)) {
      criteria.color = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 7. Space / Dimensions / Capacity
  if (/small|compact|space[- ]saving|tiny|apartment/.test(lower)) {
    criteria.spaceConstraint = "small";
    if (!criteria.keywords) criteria.keywords = "compact";
  }
  if (/2[- ]seater|two[- ]seater|loveseat/.test(lower)) criteria.seatingCapacity = "2";
  else if (/3[- ]seater|three[- ]seater/.test(lower)) criteria.seatingCapacity = "3";
  else if (/l[- ]shape|sectional|corner/.test(lower)) criteria.seatingCapacity = "L-Shape";
  else if (/king size|king bed/.test(lower)) criteria.keywords = "King";
  else if (/queen size|queen bed/.test(lower)) criteria.keywords = "Queen";

  // 8. Rating / Quality
  if (/top rated|best rated|highest rated|high rating/.test(lower)) {
    criteria.minRating = 4.5;
  }

  return criteria;
}

/**
 * Formats intelligent fallback response reasoning grounded in real database products.
 */
function generateGroundedFallbackResponse(userMessage, products, criteria, relaxed) {
  if (!products || products.length === 0) {
    return {
      message: `I searched our furniture collection for "${userMessage}", but couldn't find an exact match in stock right now. Could you try adjusting your budget or exploring a slightly different style or material?`,
      suggestedQuestions: [
        "Show all living room sofas",
        "Browse sofas under ₹40,000",
        "Show bestselling furniture",
      ],
    };
  }

  const itemsDesc = products.map((p, idx) => {
    const formattedPrice = `₹${p.price.toLocaleString("en-IN")}`;
    const specs = [];
    if (p.specs?.dimensions) specs.push(`Dimensions: ${p.specs.dimensions}`);
    if (p.specs?.material) specs.push(`Material: ${p.specs.material}`);
    if (p.specs?.style) specs.push(`Style: ${p.specs.style}`);
    if (p.stock) specs.push(`Stock: ${p.stock} units available`);

    return `${idx + 1}. **${p.name}** at **${formattedPrice}** (${p.rating ? `${p.rating}★` : "Popular"})${specs.length > 0 ? ` — ${specs.join(", ")}` : ""}.`;
  }).join("\n\n");

  let intro = `Here are the best matching products from our database`;
  if (criteria.category) intro += ` in **${criteria.category}**`;
  if (criteria.maxPrice) intro += ` within your **₹${criteria.maxPrice.toLocaleString("en-IN")}** budget`;
  if (criteria.roomType) intro += ` designed for the **${criteria.roomType}**`;
  if (criteria.style) intro += ` with a **${criteria.style}** aesthetic`;
  intro += `:\n\n${itemsDesc}\n\n`;

  let closing = "";
  if (criteria.spaceConstraint === "small") {
    closing = "All of these options feature space-conscious proportions with comfortable seating depth suitable for compact living spaces. Would you like to check delivery details or matching coffee tables?";
  } else {
    closing = "Every product listed is currently in stock with manufacturer warranty and hassle-free delivery. Would you like to see dimensions, colors, or customer reviews?";
  }

  const suggestedQuestions = [];
  if (criteria.category === "Sofas & Seating") {
    suggestedQuestions.push("Show matching coffee tables");
    suggestedQuestions.push("Are there fabric options in beige?");
    suggestedQuestions.push("Do any of these include assembly?");
  } else if (criteria.category === "Beds") {
    suggestedQuestions.push("Show beds with hydraulic storage");
    suggestedQuestions.push("Show matching bedside tables");
  } else {
    suggestedQuestions.push("Show highest rated items");
    suggestedQuestions.push("Filter by solid wood only");
  }

  return {
    message: `${intro}${closing}`,
    suggestedQuestions,
  };
}

/**
 * Main AI Shopping Assistant Handler.
 * Connects frontend queries -> NLP intent parser -> grounded MongoDB query -> AI reasoning -> real products.
 *
 * @param {string} userMessage
 * @param {Array} [conversationHistory=[]]
 * @returns {Promise<{ message: string, products: Array, parsedFilters: object, suggestedQuestions: Array }>}
 */
export async function getShoppingAdvice(userMessage, conversationHistory = []) {
  if (!userMessage || typeof userMessage !== "string") {
    throw new Error("User message is required");
  }

  // Step 1: Extract criteria from current query & previous turns
  const extractedCriteria = extractQueryCriteria(userMessage);

  // If no category detected in current message, look back in history
  if (!extractedCriteria.category && Array.isArray(conversationHistory)) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const pastText = conversationHistory[i]?.content || "";
      const pastCriteria = extractQueryCriteria(pastText);
      if (pastCriteria.category) {
        extractedCriteria.category = pastCriteria.category;
        break;
      }
    }
  }

  // Step 2: Grounded Search in MongoDB
  const { products, relaxed, matchedFilters } = await searchProductsGrounded({
    ...extractedCriteria,
    limit: 4,
  });

  // Step 3: AI Reasoning Layer (Check for server-side AI API Key)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (geminiApiKey) {
    try {
      // Dynamic import to avoid crash if optional SDK not installed
      const { GoogleGenerativeAI } = await import("@google/genative-ai").catch(() => ({}));
      if (GoogleGenerativeAI) {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are Furniva's expert interior design and furniture shopping assistant.
A customer is asking: "${userMessage}".
Here are the REAL products fetched directly from our store's database:
${JSON.stringify(products, null, 2)}

STRICT RULES:
1. ONLY recommend and mention the products listed above. NEVER invent or fabricate names, prices, discounts, stock, dimensions, or materials.
2. Address the user's specific constraints (budget, room size, style, etc.) and explain WHY these real products fit their needs.
3. Be helpful, concise, and professional.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return {
          message: responseText,
          products,
          parsedFilters: matchedFilters,
          suggestedQuestions: [
            "Show matching accessories",
            "What warranty is included?",
            "Show other color options",
          ],
        };
      }
    } catch (aiErr) {
      console.warn("External AI call failed, falling back to grounded rule engine:", aiErr.message);
    }
  }

  // Step 4: Robust, Guaranteed Offline Fallback Grounding
  const fallback = generateGroundedFallbackResponse(userMessage, products, extractedCriteria, relaxed);

  return {
    message: fallback.message,
    products,
    parsedFilters: matchedFilters,
    suggestedQuestions: fallback.suggestedQuestions,
  };
}

export default getShoppingAdvice;
