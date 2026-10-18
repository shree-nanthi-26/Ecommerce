import axiosInstance from "../api/axiosInstance";

export async function calculateOrderSummary(payload) {
  const response = await axiosInstance.post("/orders/calculate", payload);
  return response.data;
}

export async function createOrder(orderData) {
  const response = await axiosInstance.post("/orders", orderData);
  return response.data;
}

export async function getMyOrders() {
  const response = await axiosInstance.get("/orders/my");
  return response.data;
}

export async function getOrderById(orderId) {
  const response = await axiosInstance.get(`/orders/${orderId}`);
  return response.data;
}

export async function cancelOrder(orderId, reason) {
  const response = await axiosInstance.post(`/orders/${orderId}/cancel`, { reason });
  return response.data;
}

