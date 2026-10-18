import axiosInstance from "../api/axiosInstance";

export async function getDashboardStats(params = {}) {
  const response = await axiosInstance.get("/admin/dashboard", { params });
  return response.data;
}

export async function getUsers() {
  const response = await axiosInstance.get("/admin/users");
  return response.data;
}

export async function updateUserRole(userId, role) {
  const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function deleteUser(userId) {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
}

export async function getAdminProducts(params) {
  const response = await axiosInstance.get("/admin/products", { params });
  return response.data;
}

export async function getAdminProductById(id) {
  const response = await axiosInstance.get(`/admin/products/${id}`);
  return response.data;
}

export async function createAdminProduct(productData) {
  const response = await axiosInstance.post("/admin/products", productData);
  return response.data;
}

export async function updateAdminProduct(id, productData) {
  const response = await axiosInstance.put(`/admin/products/${id}`, productData);
  return response.data;
}

export async function deleteAdminProduct(id) {
  const response = await axiosInstance.delete(`/admin/products/${id}`);
  return response.data;
}

export async function getAdminOrders() {
  const response = await axiosInstance.get("/admin/orders");
  return response.data;
}

export async function updateOrderStatus(orderId, payload) {
  const body = typeof payload === "object" ? payload : { status: payload };
  const response = await axiosInstance.put(`/admin/orders/${orderId}/status`, body);
  return response.data;
}

export async function toggleOrderPayment(orderId, reason) {
  const response = await axiosInstance.put(`/admin/orders/${orderId}/pay`, { reason });
  return response.data;
}

export async function getAttackLogs() {
  const response = await axiosInstance.get("/admin/attack-logs");
  return response.data;
}

export async function getBlockedIPs() {
  const response = await axiosInstance.get("/admin/blocked-ips");
  return response.data;
}

export async function blockIP(ip, reason, expiresAt) {
  const response = await axiosInstance.post("/admin/blocked-ips", { ip, reason, expiresAt });
  return response.data;
}

export async function unblockIP(id) {
  const response = await axiosInstance.put(`/admin/blocked-ips/${id}/unblock`);
  return response.data;
}

export async function getAuditLogs(params = {}) {
  const response = await axiosInstance.get("/admin/audit-logs", { params });
  return response.data;
}

export async function getSecurityDashboard() {
  const response = await axiosInstance.get("/admin/security/dashboard");
  return response.data;
}

export async function getSecurityEvents(params = {}) {
  const response = await axiosInstance.get("/admin/security/events", { params });
  return response.data;
}
