import axiosInstance from "../api/axiosInstance";

export async function getFrequentlyBoughtTogether(productId, limit = 2) {
  const response = await axiosInstance.get(
    `/recommendations/product/${productId}/frequently-bought-together`,
    { params: { limit } }
  );
  return response.data;
}

export async function getSimilarProducts(productId, limit = 4) {
  const response = await axiosInstance.get(
    `/recommendations/product/${productId}/similar`,
    { params: { limit } }
  );
  return response.data;
}

export async function getCustomersAlsoBought(productId, limit = 4) {
  const response = await axiosInstance.get(
    `/recommendations/product/${productId}/customers-also-bought`,
    { params: { limit } }
  );
  return response.data;
}

export async function getYouMayAlsoLike(productId = null, limit = 4) {
  const response = await axiosInstance.get("/recommendations/you-may-also-like", {
    params: { productId, limit },
  });
  return response.data;
}

export async function getPersonalizedRecommendations({
  recentIds = [],
  wishlistIds = [],
  cartIds = [],
  limit = 4,
} = {}) {
  const response = await axiosInstance.get("/recommendations/for-you", {
    params: {
      recentIds: recentIds.join(","),
      wishlistIds: wishlistIds.join(","),
      cartIds: cartIds.join(","),
      limit,
    },
  });
  return response.data;
}
