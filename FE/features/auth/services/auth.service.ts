import httpClient from "@/core/api/http-client";

export const AuthService = {
  async login(data: any) {
    const response = await httpClient.post("/api/v1/auth/login", data);
    return response.data;
  },

  async logout() {
    const response = await httpClient.post("/api/v1/auth/logout");
    return response.data;
  },

  async forgotPassword(data: { email: string }) {
    const response = await httpClient.post("/api/v1/auth/forgot-password", data);
    return response.data;
  },
};
