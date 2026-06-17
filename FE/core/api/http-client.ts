import axios from "axios";
import Cookies from "js-cookie";

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Danh sách các endpoints không cần truyền Bearer token
const NO_AUTH_ENDPOINTS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
];

// Request Interceptor
httpClient.interceptors.request.use(
  (config) => {
    const isNoAuthEndpoint = NO_AUTH_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isNoAuthEndpoint) {
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
httpClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const isNoAuthEndpoint = NO_AUTH_ENDPOINTS.some((endpoint) =>
      originalRequest?.url?.includes(endpoint)
    );

    if (err.response?.status === 401 && !isNoAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;
      const token = Cookies.get("accessToken");
      if (!token) {
        return Promise.reject(err);
      }
      try {
        await axios.post("/api/auth/refresh");
        return httpClient(originalRequest);
      } catch (refreshError) {
        Cookies.remove("accessToken");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(err);
  }
);

export default httpClient;
