import axiosInstance from "../api/axiosInstance";

export async function getDashboardStats() {
  const response = await axiosInstance.get("/admin/dashboard");
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

export async function getAdminOrders() {
  const response = await axiosInstance.get("/admin/orders");
  return response.data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await axiosInstance.put(`/admin/orders/${orderId}/status`, { status });
  return response.data;
}

export async function toggleOrderPayment(orderId) {
  const response = await axiosInstance.put(`/admin/orders/${orderId}/pay`);
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
