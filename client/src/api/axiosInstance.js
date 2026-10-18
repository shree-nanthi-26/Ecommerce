import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use((config) => {
  let storedUser = localStorage.getItem("furniva_user");
  if (!storedUser) {
    storedUser = localStorage.getItem("electromart_user");
    if (storedUser) {
      localStorage.setItem("furniva_user", storedUser);
      localStorage.removeItem("electromart_user");
    }
  }
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // Ignore parse error
    }
  }
  return config;
});

export default axiosInstance;
