"use client";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";

const REMEMBER_EMAIL_KEY = "sociala_remembered_email";

export function useLogout() {
  const router = useRouter();
  const { success: toastSuccess } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Notify BE to revoke all refreshTokens
      await api.post("/api/v1/user/auth/logout");
    } catch {
      // Ignore network errors — always clear FE session
    } finally {
      // Clear all session data regardless of API result
      Cookies.remove("accessToken");
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      toastSuccess("Đã đăng xuất thành công");
      router.push("/login");
      setIsLoggingOut(false);
    }
  }, [router, toastSuccess]);

  return { logout, isLoggingOut };
}
