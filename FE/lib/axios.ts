import Cookies from "js-cookie";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Danh sách các endpoints không cần truyền Bearer token
const NO_AUTH_ENDPOINTS = [
  "/api/v1/user/auth/login",
  "/api/v1/user/auth/register",
];

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Kiểm tra xem url hiện tại có nằm trong danh sách không cần auth hay không
    const isNoAuthEndpoint = NO_AUTH_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isNoAuthEndpoint) {
      // Lấy token từ cookie
      const token = Cookies.get("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    // Tự động refresh token nếu gặp lỗi 401
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post("/api/auth/refresh"); // Gọi đến bảng REFRESH_TOKENS (điều chỉnh endpoint nếu cần)
        return api(originalRequest);
      } catch (refreshError) {
        // Xử lý khi refresh token thất bại (ví dụ: logout)
        Cookies.remove("accessToken");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(err);
  },
);

export default api;
