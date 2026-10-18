import axiosInstance from "../api/axiosInstance";

/**
 * Get all addresses for the authenticated user
 */
export async function getAddresses() {
  const response = await axiosInstance.get("/addresses");
  return response.data;
}

/**
 * Get a single address by ID
 */
export async function getAddressById(id) {
  const response = await axiosInstance.get(`/addresses/${id}`);
  return response.data;
}

/**
 * Create a new address
 */
export async function createAddress(addressData) {
  const response = await axiosInstance.post("/addresses", addressData);
  return response.data;
}

/**
 * Update an existing address
 */
export async function updateAddress(id, addressData) {
  const response = await axiosInstance.put(`/addresses/${id}`, addressData);
  return response.data;
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(id) {
  const response = await axiosInstance.patch(`/addresses/${id}/default`);
  return response.data;
}

/**
 * Delete an address
 */
export async function deleteAddress(id) {
  const response = await axiosInstance.delete(`/addresses/${id}`);
  return response.data;
}
