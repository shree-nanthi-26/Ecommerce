import Product from "../models/Product.js";

/**
 * Normalizes user-specified category keywords into store category names.
 */
export function normalizeCategory(term = "") {
  const lower = term.toLowerCase().trim();
  if (/sofa|couch|sectional|recliner|seating|futon/.test(lower)) return "Sofas & Seating";
  if (/dining table|dining chair|dining set|dinner table/.test(lower)) return "Dining Tables";
  if (/bed|mattress|cot|bunk bed|king bed|queen bed/.test(lower)) return "Beds";
  if (/chair|accent chair|armchair|lounge chair|office chair|study chair/.test(lower)) return "Chairs";
  if (/table|coffee table|side table|end table|center table/.test(lower)) return "Tables";
  if (/desk|study desk|workstation|office table/.test(lower)) return "Tables";
  if (/wardrobe|cupboard|almirah|closet/.test(lower)) return "Wardrobes";
  if (/bookshelf|bookcase|display unit|wall shelf/.test(lower)) return "Bookshelves";
  if (/tv unit|tv stand|media console|entertainment center/.test(lower)) return "TV Units";
  if (/lighting|lamp|pendant|chandelier/.test(lower)) return "Lighting";
  if (/decor|rug|carpet|mirror|cushion/.test(lower)) return "Home Decor";
  return null;
}

/**
 * Searches MongoDB database for real products matching strict grounded criteria.
 *
 * @param {object} criteria
 * @param {string} [criteria.category]
 * @param {number} [criteria.minPrice]
 * @param {number} [criteria.maxPrice]
 * @param {string} [criteria.roomType]
 * @param {string} [criteria.material]
 * @param {string} [criteria.color]
 * @param {string} [criteria.style]
 * @param {string} [criteria.seatingCapacity]
 * @param {number} [criteria.minRating]
 * @param {boolean} [criteria.inStockOnly=true]
 * @param {string} [criteria.keywords]
 * @param {number} [criteria.limit=4]
 * @returns {Promise<{ products: Array, totalMatches: number, relaxed: boolean, matchedFilters: object }>}
 */
export async function searchProductsGrounded(criteria = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    roomType,
    material,
    color,
    style,
    seatingCapacity,
    minRating,
    inStockOnly = true,
    keywords,
    limit = 4,
  } = criteria;

  const matchedFilters = {};

  // Build primary filter object
  const buildQuery = (options = { strictSpecs: true }) => {
    const q = {};

    // 1. Availability filter
    if (inStockOnly) {
      q.stock = { $gt: 0 };
      matchedFilters.inStock = true;
    }

    // 2. Category filter
    if (category) {
      const canonicalCategory = normalizeCategory(category);
      if (canonicalCategory) {
        q.category = canonicalCategory;
        matchedFilters.category = canonicalCategory;
      } else {
        q.category = new RegExp(category, "i");
        matchedFilters.category = category;
      }
    }

    // 3. Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      q.price = {};
      if (minPrice !== undefined && minPrice > 0) {
        q.price.$gte = Number(minPrice);
        matchedFilters.minPrice = minPrice;
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        q.price.$lte = Number(maxPrice);
        matchedFilters.maxPrice = maxPrice;
      }
    }

    // 4. Rating filter
    if (minRating) {
      q.rating = { $gte: Number(minRating) };
      matchedFilters.minRating = minRating;
    }

    // 5. Specs filters (applied strictly if strictSpecs is true)
    if (options.strictSpecs) {
      if (roomType) {
        q["specs.roomType"] = new RegExp(roomType, "i");
        matchedFilters.roomType = roomType;
      }
      if (material) {
        q["specs.material"] = new RegExp(material, "i");
        matchedFilters.material = material;
      }
      if (color) {
        q["specs.color"] = new RegExp(color, "i");
        matchedFilters.color = color;
      }
      if (style) {
        q["specs.style"] = new RegExp(style, "i");
        matchedFilters.style = style;
      }
      if (seatingCapacity) {
        q["specs.seatingCapacity"] = new RegExp(`^${seatingCapacity}`, "i");
        matchedFilters.seatingCapacity = seatingCapacity;
      }
    }

    // 6. Keywords filter
    if (keywords && keywords.trim()) {
      const cleanKeywords = keywords.trim();
      q.$or = [
        { name: new RegExp(cleanKeywords, "i") },
        { description: new RegExp(cleanKeywords, "i") },
        { "specs.dimensions": new RegExp(cleanKeywords, "i") },
      ];
      matchedFilters.keywords = cleanKeywords;
    }

    return q;
  };

  // Try strict query first
  const strictQuery = buildQuery({ strictSpecs: true });
  let products = await Product.find(strictQuery)
    .sort({ rating: -1, isBestseller: -1, price: 1 })
    .limit(limit)
    .lean();

  let relaxed = false;

  // If fewer than 2 products found and specs were applied, relax secondary specs
  if (products.length < 2 && (color || style || roomType || material)) {
    const relaxedQuery = buildQuery({ strictSpecs: false });
    // Still keep roomType if possible
    if (roomType) {
      relaxedQuery["specs.roomType"] = new RegExp(roomType, "i");
    }

    const relaxedProducts = await Product.find(relaxedQuery)
      .sort({ rating: -1, price: 1 })
      .limit(limit)
      .lean();

    if (relaxedProducts.length > products.length) {
      products = relaxedProducts;
      relaxed = true;
    }
  }

  // If STILL no products found within exact category and price, broaden to best matching category products
  if (products.length === 0 && maxPrice) {
    const fallbackCategoryQuery = {};
    if (inStockOnly) fallbackCategoryQuery.stock = { $gt: 0 };
    if (category) {
      const canon = normalizeCategory(category);
      if (canon) fallbackCategoryQuery.category = canon;
    }
    // Find closest within price or lowest price in category
    const closest = await Product.find(fallbackCategoryQuery)
      .sort({ price: 1, rating: -1 })
      .limit(limit)
      .lean();

    if (closest.length > 0) {
      products = closest;
      relaxed = true;
    }
  }

  return {
    products,
    totalMatches: products.length,
    relaxed,
    matchedFilters,
  };
}

export default searchProductsGrounded;
