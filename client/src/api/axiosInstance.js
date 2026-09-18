import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use((config) => {
  const storedUser =
    localStorage.getItem("furniva_user") ||
    localStorage.getItem("electromart_user"); // Legacy compatibility fallback key
  if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

export default axiosInstance;
