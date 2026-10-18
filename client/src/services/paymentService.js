import axiosInstance from "../api/axiosInstance";

export async function createPaymentOrder(data) {
  const payload = typeof data === "object" && data !== null ? data : { amount: data };
  const response = await axiosInstance.post(`/payment/create-order`, payload);
  return response.data;
}

export async function verifyPayment(payload) {
  const response = await axiosInstance.post(`/payment/verify`, payload);
  return response.data;
}

export default { createPaymentOrder, verifyPayment };
