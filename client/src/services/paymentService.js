import axiosInstance from "../api/axiosInstance";

export async function createPaymentOrder(amount) {
  const response = await axiosInstance.post(`/payment/create-order`, { amount });
  return response.data;
}

export async function verifyPayment(payload) {
  const response = await axiosInstance.post(`/payment/verify`, payload);
  return response.data;
}

export default { createPaymentOrder, verifyPayment };
