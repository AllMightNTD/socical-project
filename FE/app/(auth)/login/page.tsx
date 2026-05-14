"use client";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email không được để trống").email("Định dạng email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoginError("");
      const response = await api.post("/api/v1/user/auth/login", data);

      const token = response.data?.metadata?.accessToken || response.data?.accessToken;
      if (token) {
        Cookies.set("accessToken", token, { expires: 7 }); // Lưu cookie 7 ngày
      }

      router.push("/");
    } catch (error: any) {
      setLoginError(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  const handleFacebookLogin = () => {
    // Chuyển hướng tới endpoint OAuth của Backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    window.location.href = `${backendUrl}/api/v1/auth/facebook`;
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left side - Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-blue-50/50 flex-col p-12 relative overflow-hidden">
        <div className="flex items-center gap-2 text-blue-600 mb-20">
          <Zap size={32} fill="currentColor" className="text-emerald-400" />
          <span className="text-3xl font-black tracking-tight">Sociala.</span>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">
          <svg
            viewBox="0 0 500 400"
            className="w-full max-w-md drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="400" height="300" x="50" y="50" rx="4" fill="white" />
            <path d="M100 100 Q 150 50 200 100 T 300 100" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="160" cy="180" r="25" fill="#1E293B" />
            <path d="M160 205 L140 320 L180 320 Z" fill="#2563EB" />
            <circle cx="340" cy="190" r="22" fill="#4B5563" />
            <path d="M340 212 L310 320 L370 320 Z" fill="#2563EB" />
            <path d="M200 220 L300 220" stroke="#FCA5A5" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-7/12 flex flex-col items-center px-6 lg:px-20 py-12">
        <div className="w-full flex justify-end gap-3 mb-16">
          <Link href="/login" className="px-8 py-2.5 rounded-full bg-slate-800 text-white text-sm font-bold shadow-lg">
            Login
          </Link>
          <Link href="/register" className="px-8 py-2.5 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg">
            Register
          </Link>
        </div>

        <div className="w-full max-w-md flex flex-col">
          <h1 className="text-3xl font-bold text-slate-800 mb-10">
            Login into your account
          </h1>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {loginError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">
                {loginError}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Your Email Address"
                  {...register("emailOrPhone")}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border ${errors.emailOrPhone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'} focus:ring-1 outline-none transition-all text-slate-600 placeholder:text-slate-400`}
                />
              </div>
              {errors.emailOrPhone && (
                <p className="text-red-500 text-sm ml-1">{errors.emailOrPhone.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  {...register("password")}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'} focus:ring-1 outline-none transition-all text-slate-600 placeholder:text-slate-400`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm ml-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-600">
                  Remember me
                </span>
              </label>
              <Link href="/forgot-password" className="text-sm font-bold text-slate-600 hover:text-blue-600">
                Forgot your Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold text-lg shadow-xl hover:bg-slate-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Login"
              )}
            </button>

            <p className="text-center text-sm font-semibold text-slate-400">
              Dont have account{" "}
              <Link href="/register" className="text-blue-600 font-bold ml-1">
                Register
              </Link>
            </p>

            <div className="relative flex items-center justify-center py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-4 text-sm font-semibold text-slate-400 bg-white italic">
                Or, Sign in with your social account
              </span>
            </div>

            <div className="space-y-3">
              <button type="button" className="w-full flex items-center px-4 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md">
                <div className="p-2 bg-white rounded-md flex items-center justify-center mr-4">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.09H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.91l3.66-2.8z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.09l3.66 2.8c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335" />
                  </svg>
                </div>
                <span className="flex-1 font-bold text-center">Sign in with Google</span>
              </button>

              <button 
                type="button" 
                onClick={handleFacebookLogin}
                className="w-full flex items-center px-4 py-1 rounded-lg bg-[#3b5999] text-white hover:bg-[#2d4373] transition-colors shadow-md"
              >
                <div className="p-2 bg-white rounded-md flex items-center justify-center mr-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-[#3b5999]" aria-hidden="true">
                    <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.3v-2.9h2.3V9.2c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .08 2 .08v2.2h-1.1c-1.1 0-1.5.73-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z" fill="#3b5999" />
                  </svg>
                </div>
                <span className="flex-1 font-bold text-center">Sign in with Facebook</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
