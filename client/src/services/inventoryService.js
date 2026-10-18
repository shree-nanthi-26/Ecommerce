import axiosInstance from "../api/axiosInstance";

export async function getInventory(params = {}) {
  const response = await axiosInstance.get("/admin/inventory", { params });
  return response.data;
}

export async function adjustStock(payload) {
  const response = await axiosInstance.post("/admin/inventory/adjust", payload);
  return response.data;
}

export async function getInventoryHistory(params = {}) {
  const response = await axiosInstance.get("/admin/inventory/history", { params });
  return response.data;
}
