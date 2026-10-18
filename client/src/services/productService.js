import axiosInstance from "../api/axiosInstance";

export async function getAllProducts(params) {
  const response = await axiosInstance.get("/products", { params });
  return response.data;
}

export async function getProductById(id) {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
}

export async function createProduct(productData) {
  const response = await axiosInstance.post("/products", productData);
  return response.data;
}

export async function updateProduct(id, productData) {
  const response = await axiosInstance.put(`/products/${id}`, productData);
  return response.data;
}

export async function deleteProduct(id) {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
}

export async function checkProductDelivery(productId, pincode) {
  const targetId = productId || "general";
  const response = await axiosInstance.get(`/products/${targetId}/delivery-check`, {
    params: { pincode },
  });
  return response.data;
}

export async function getSearchSuggestions(query = "") {
  const response = await axiosInstance.get("/products/search/suggestions", {
    params: { q: query },
  });
  return response.data;
}



