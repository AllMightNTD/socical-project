import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useToast } from "@/core/providers/toast-provider";
import { AuthService } from "../services/auth.service";

const REMEMBER_EMAIL_KEY = "sociala_remembered_email";

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email không được để trống").email("Định dạng email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface FieldErrors {
  email?: string;
  password?: string;
}

export function useLogin() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rememberMe, setRememberMe] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setValue("emailOrPhone", savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = async (data: LoginFormValues) => {
    setFieldErrors({});
    try {
      const result = await AuthService.login({
        ...data,
        rememberMe,
      });

      const token = result?.metadata?.accessToken || result?.accessToken;
      const cookieExpireDays = result?.cookieExpireDays ?? 1;

      if (token) {
        Cookies.set("accessToken", token, { expires: cookieExpireDays });
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.emailOrPhone);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      toastSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      router.push("/");
    } catch (error: any) {
      const errorCode = error.response?.data?.errorCode;
      const message = error.response?.data?.message;

      if (errorCode === "EMAIL_NOT_FOUND") {
        setFieldErrors({ email: message || "Email không tồn tại" });
      } else if (errorCode === "WRONG_PASSWORD") {
        setFieldErrors({ password: message || "Sai mật khẩu" });
      } else {
        toastError(message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    setValue,
    errors,
    isSubmitting,
    fieldErrors,
    rememberMe,
    setRememberMe,
    clearFieldError,
  };
}
