import axiosInstance from "../api/axiosInstance";

export async function getAllProducts(params) {
  const response = await axiosInstance.get("/products", { params });
  return response.data;
}

export async function getProductById(id) {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
}
