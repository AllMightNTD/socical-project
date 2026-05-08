import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const path = request.nextUrl.pathname;

  // Bảo vệ route trang chủ
  if (path === '/') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
  }

  // Chặn truy cập lại login/register khi đã đăng nhập
  if ((path === '/login' || path === '/register') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register'],
};
