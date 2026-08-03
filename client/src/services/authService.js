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
