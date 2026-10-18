import axiosInstance from "../api/axiosInstance";

export async function getProductReviews(productId, params = {}) {
  const response = await axiosInstance.get(`/reviews/product/${productId}`, {
    params,
  });
  return response.data;
}

export async function getReviewEligibility(productId) {
  const response = await axiosInstance.get(
    `/reviews/product/${productId}/eligibility`
  );
  return response.data;
}

export async function createReview(productId, reviewData) {
  const response = await axiosInstance.post(
    `/reviews/product/${productId}`,
    reviewData
  );
  return response.data;
}

export async function updateReview(reviewId, reviewData) {
  const response = await axiosInstance.put(`/reviews/${reviewId}`, reviewData);
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await axiosInstance.delete(`/reviews/${reviewId}`);
  return response.data;
}

export async function toggleReviewHelpful(reviewId) {
  const response = await axiosInstance.post(`/reviews/${reviewId}/helpful`);
  return response.data;
}
