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
