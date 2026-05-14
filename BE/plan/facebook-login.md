# Plan: Login with Facebook (Full-stack)

## 🎯 Tổng quan
Triển khai cơ chế xác thực OAuth2 thông qua Facebook. Kết nối nút bấm từ Frontend tới các endpoint xử lý ở Backend để hoàn tất luồng đăng nhập.

## 🏗️ Kiến trúc & Dòng chảy (Flow)
1.  **Frontend (FE)**: Người dùng nhấn nút "Sign in with Facebook".
2.  **Redirect**: FE chuyển hướng trình duyệt tới `BACKEND_URL/api/v1/auth/facebook`.
3.  **Facebook Auth**: Facebook xử lý đăng nhập và yêu cầu người dùng cấp quyền.
4.  **Callback**: Facebook gửi mã xác thực về `BACKEND_URL/api/v1/auth/facebook/callback`.
5.  **BE Processing**: BE xác thực, tạo/tìm User và Profile, sau đó trả về JWT Token.
6.  **Finalize**: BE chuyển hướng người dùng về FE kèm theo Token (qua Cookie hoặc Query String).

## ✅ Checklist Triển khai

### 1. Backend (Đã hoàn thành cơ bản)
- [x] Cài đặt `passport-facebook`.
- [x] Cập nhật `User` Entity (`facebook_id`).
- [x] Tạo `FacebookStrategy` & `FacebookAuthGuard`.
- [x] Triển khai `validateFacebookUser` trong `AuthService`.
- [x] Tạo các endpoint trong `AuthController`.

### 2. Frontend (Cần thực hiện)
- [ ] **Gắn sự kiện Click**: Cập nhật nút "Sign in with Facebook" trong `app/(auth)/login/page.tsx` để chuyển hướng tới link OAuth của BE.
- [ ] **Xử lý Redirect URL**: Đảm bảo FE có thể nhận diện khi đăng nhập thành công (thông qua middleware hoặc trang callback riêng) để lưu Token vào Cookie.

### 3. Cấu hình & Cấp quyền
- [ ] Điền thông tin thật vào `.env` (App ID, Secret).
- [ ] Cấu hình "Valid OAuth Redirect URIs" trên Facebook Dashboard trùng với URL của Backend.

## ⚠️ Lưu ý kỹ thuật
- Khi chạy Docker, cần đảm bảo `NEXT_PUBLIC_API_URL` được cấu hình đúng để FE có thể gọi tới BE.
- Nên xử lý hiển thị trạng thái "Loading" khi người dùng đang được chuyển hướng.
