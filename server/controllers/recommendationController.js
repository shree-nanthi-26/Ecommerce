import {
  getFrequentlyBoughtTogether,
  getCustomersAlsoBought,
  getSimilarProducts,
  getPersonalizedRecommendations,
  getYouMayAlsoLike,
} from "../services/recommendationService.js";

export async function getFrequentlyBoughtTogetherHandler(req, res, next) {
  try {
    const { productId } = req.params;
    const limit = Math.max(1, Math.min(6, parseInt(req.query.limit, 10) || 2));
    const result = await getFrequentlyBoughtTogether(productId, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCustomersAlsoBoughtHandler(req, res, next) {
  try {
    const { productId } = req.params;
    const limit = Math.max(1, Math.min(12, parseInt(req.query.limit, 10) || 4));
    const products = await getCustomersAlsoBought(productId, limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function getSimilarProductsHandler(req, res, next) {
  try {
    const { productId } = req.params;
    const limit = Math.max(1, Math.min(12, parseInt(req.query.limit, 10) || 4));
    const products = await getSimilarProducts(productId, limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function getYouMayAlsoLikeHandler(req, res, next) {
  try {
    const productId = req.query.productId || req.params.productId;
    const limit = Math.max(1, Math.min(12, parseInt(req.query.limit, 10) || 4));
    const products = await getYouMayAlsoLike(productId, limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function getPersonalizedRecommendationsHandler(req, res, next) {
  try {
    const limit = Math.max(1, Math.min(12, parseInt(req.query.limit, 10) || 4));
    const userId = req.user?._id;

    // Parse guest context from query params
    const recentIds = req.query.recentIds ? req.query.recentIds.split(",").filter(Boolean) : [];
    const wishlistIds = req.query.wishlistIds ? req.query.wishlistIds.split(",").filter(Boolean) : [];
    const cartIds = req.query.cartIds ? req.query.cartIds.split(",").filter(Boolean) : [];

    const products = await getPersonalizedRecommendations({
      userId,
      recentIds,
      wishlistIds,
      cartIds,
      limit,
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
}
