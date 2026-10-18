import axiosInstance from "../api/axiosInstance";

export async function getWishlist() {
  const response = await axiosInstance.get("/wishlist");
  return response.data;
}

export async function syncWishlist(productIds) {
  const response = await axiosInstance.post("/wishlist/sync", { productIds });
  return response.data;
}

export async function addToWishlist(productId) {
  const response = await axiosInstance.post("/wishlist/products", { productId });
  return response.data;
}

export async function removeFromWishlist(productId) {
  const response = await axiosInstance.delete(`/wishlist/products/${productId}`);
  return response.data;
}

export async function clearWishlist() {
  const response = await axiosInstance.delete("/wishlist");
  return response.data;
}

export async function updateWishlistNotifications(productId, data) {
  const response = await axiosInstance.put(`/wishlist/notifications/${productId}`, data);
  return response.data;
}

export async function moveWishlistItemToCart(productId) {
  const response = await axiosInstance.post(`/wishlist/move-to-cart/${productId}`);
  return response.data;
}

