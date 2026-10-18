import axiosInstance from "../api/axiosInstance";

/**
 * Customer: Create a new support ticket
 */
export async function createTicket(payload) {
  const response = await axiosInstance.post("/tickets", payload);
  return response.data;
}

/**
 * Customer: Get customer's ticket history
 */
export async function getMyTickets(params) {
  const response = await axiosInstance.get("/tickets/my", { params });
  return response.data;
}

/**
 * Shared: Get single ticket details and conversation thread
 */
export async function getTicketById(id) {
  const response = await axiosInstance.get(`/tickets/${id}`);
  return response.data;
}

/**
 * Shared: Add message/reply to a ticket
 */
export async function addTicketMessage(id, payload) {
  const response = await axiosInstance.post(`/tickets/${id}/messages`, payload);
  return response.data;
}

/**
 * Admin: Get all tickets with filtering and stats
 */
export async function getAdminTickets(params) {
  const response = await axiosInstance.get("/tickets/admin/all", { params });
  return response.data;
}

/**
 * Admin: Update ticket status
 */
export async function updateTicketStatus(id, payload) {
  const response = await axiosInstance.put(`/tickets/admin/${id}/status`, payload);
  return response.data;
}

/**
 * Admin: Assign ticket to an admin agent
 */
export async function assignTicket(id, payload) {
  const response = await axiosInstance.put(`/tickets/admin/${id}/assign`, payload);
  return response.data;
}

/**
 * Admin: Get list of admin users for assignment
 */
export async function getAdminAgents() {
  const response = await axiosInstance.get("/tickets/admin/agents");
  return response.data;
}
