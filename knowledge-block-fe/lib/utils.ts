// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Hàm cn (Class Name) giúp gộp các class Tailwind CSS.
 * twMerge giúp xử lý các class bị ghi đè (vd: 'p-2 p-4' sẽ thành 'p-4')
 * clsx giúp viết các class có điều kiện (vd: isActive && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
