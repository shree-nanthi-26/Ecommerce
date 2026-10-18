import axiosInstance from "../api/axiosInstance";

export async function createReturnRequest(data) {
  const response = await axiosInstance.post("/returns", data);
  return response.data;
}

export async function getMyReturns() {
  const response = await axiosInstance.get("/returns/my");
  return response.data;
}

export async function getReturnByOrderId(orderId) {
  const response = await axiosInstance.get(`/returns/order/${orderId}`);
  return response.data;
}

export async function getReturnById(returnId) {
  const response = await axiosInstance.get(`/returns/${returnId}`);
  return response.data;
}

export async function getAllReturnsAdmin(params = {}) {
  const response = await axiosInstance.get("/returns/admin/all", { params });
  return response.data;
}

export async function updateReturnStatusAdmin(returnId, data) {
  const response = await axiosInstance.put(`/returns/admin/${returnId}/status`, data);
  return response.data;
}
