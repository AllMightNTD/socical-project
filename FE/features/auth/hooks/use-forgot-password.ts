import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthService } from "../services/auth.service";

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Định dạng email không hợp lệ"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function useForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setErrorMessage("");
      const result = await AuthService.forgotPassword(data);
      
      setSuccessMessage(
        result?.message || 
        "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn."
      );
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || 
        "Đã xảy ra lỗi trong quá trình gửi yêu cầu. Vui lòng thử lại sau."
      );
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    isSuccess,
    setIsSuccess,
    errorMessage,
    successMessage,
  };
}
