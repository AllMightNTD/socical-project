// src/lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    // Tự động refresh token nếu gặp lỗi 401
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await axios.post("/api/auth/refresh"); // Gọi đến bảng REFRESH_TOKENS
      return api(originalRequest);
    }
    return Promise.reject(err);
  },
);

export default api;
