import axiosInstance from "../api/axiosInstance";

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
