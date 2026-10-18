import axiosInstance from "../api/axiosInstance";

export async function registerUser(name, email, password) {
  const response = await axiosInstance.post("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
}

export async function loginUser(email, password) {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function forgotPassword(email) {
  const response = await axiosInstance.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token, password) {
  const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
  return response.data;
}

export async function verifyEmailToken(token) {
  const response = await axiosInstance.get(`/auth/verify-email/${token}`);
  return response.data;
}

export async function resendVerificationEmail() {
  const response = await axiosInstance.post("/auth/resend-verification");
  return response.data;
}

export async function changePassword(currentPassword, newPassword, confirmPassword, revokeOtherSessions = true) {
  const response = await axiosInstance.post("/auth/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
    revokeOtherSessions,
  });
  return response.data;
}

export async function validate2FALogin(tempToken, code, recoveryCode) {
  const response = await axiosInstance.post("/auth/2fa/validate-login", {
    tempToken,
    code,
    recoveryCode,
  });
  return response.data;
}

export async function setup2FA() {
  const response = await axiosInstance.post("/auth/2fa/setup");
  return response.data;
}

export async function verify2FASetup(code) {
  const response = await axiosInstance.post("/auth/2fa/verify-setup", { code });
  return response.data;
}

export async function disable2FA(password, code) {
  const response = await axiosInstance.post("/auth/2fa/disable", { password, code });
  return response.data;
}

export async function getActiveSessions() {
  const response = await axiosInstance.get("/auth/sessions");
  return response.data;
}

export async function revokeSession(sessionId) {
  const response = await axiosInstance.delete(`/auth/sessions/${sessionId}`);
  return response.data;
}

export async function logoutAllSessions() {
  const response = await axiosInstance.post("/auth/logout-all");
  return response.data;
}

export async function logoutOtherSessions() {
  const response = await axiosInstance.post("/auth/logout-others");
  return response.data;
}
