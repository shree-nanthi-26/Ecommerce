import axiosInstance from "../api/axiosInstance";

export async function getCart() {
  const response = await axiosInstance.get("/cart");
  return response.data;
}

export async function syncCart(items) {
  const response = await axiosInstance.post("/cart/sync", { items });
  return response.data;
}

export async function addCartItem(productId, quantity = 1) {
  const response = await axiosInstance.post("/cart/items", { productId, quantity });
  return response.data;
}

export async function updateCartItem(productId, quantity) {
  const response = await axiosInstance.put(`/cart/items/${productId}`, { quantity });
  return response.data;
}

export async function removeCartItem(productId) {
  const response = await axiosInstance.delete(`/cart/items/${productId}`);
  return response.data;
}

export async function clearCart() {
  const response = await axiosInstance.delete("/cart");
  return response.data;
}
