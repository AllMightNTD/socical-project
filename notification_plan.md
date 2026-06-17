# Notification Feature Plan

## Mục tiêu

Xây dựng hệ thống Notification giúp người dùng nhận được các thông báo liên quan đến hoạt động trên nền tảng theo thời gian thực tương tự Facebook.

Các loại thông báo bao gồm:

* Có người gửi lời mời kết bạn.
* Có người chấp nhận lời mời kết bạn.
* Có người thích bài viết.
* Có người bình luận bài viết.
* Có người trả lời bình luận.
* Có người nhắc đến (mention) người dùng.
* Có người chia sẻ bài viết.
* Thông báo hệ thống.

---

# Notification Types

## Friend Request

Ví dụ:

```text
Nguyễn Văn A đã gửi cho bạn lời mời kết bạn.
```

Payload:

```json
{
  "type": "FRIEND_REQUEST",
  "referenceId": 100
}
```

---

## Friend Accepted

Ví dụ:

```text
Nguyễn Văn B đã chấp nhận lời mời kết bạn của bạn.
```

Payload:

```json
{
  "type": "FRIEND_ACCEPTED",
  "referenceId": 100
}
```

---

## Post Like

Ví dụ:

```text
Nguyễn Văn A đã thích bài viết của bạn.
```

Payload:

```json
{
  "type": "POST_LIKE",
  "referenceId": 500
}
```

---

## Post Comment

Ví dụ:

```text
Nguyễn Văn A đã bình luận bài viết của bạn.
```

Payload:

```json
{
  "type": "POST_COMMENT",
  "referenceId": 500
}
```

---

## Comment Reply

Ví dụ:

```text
Nguyễn Văn A đã trả lời bình luận của bạn.
```

Payload:

```json
{
  "type": "COMMENT_REPLY",
  "referenceId": 800
}
```

---

## Mention

Ví dụ:

```text
Nguyễn Văn A đã nhắc đến bạn trong một bài viết.
```

Payload:

```json
{
  "type": "MENTION",
  "referenceId": 500
}
```

---

# Backend APIs

## Lấy danh sách thông báo

```http
GET /api/v1/notifications
```

Query Params:

```http
?page=1
&size=20
```

Response:

```json
{
  "data": [
    {
      "id": 1,
      "type": "POST_COMMENT",
      "content": "Nguyễn Văn A đã bình luận bài viết của bạn.",
      "isRead": false,
      "createdAt": "2026-06-17T10:00:00"
    }
  ]
}
```

---

## Lấy số lượng thông báo chưa đọc

```http
GET /api/v1/notifications/unread-count
```

Response:

```json
{
  "count": 12
}
```

---

## Đánh dấu đã đọc

```http
PUT /api/v1/notifications/{id}/read
```

---

## Đánh dấu tất cả đã đọc

```http
PUT /api/v1/notifications/read-all
```

---

# Real-time Notification

## WebSocket Event

Khi có thông báo mới, server phát sự kiện:

```json
{
  "event": "NEW_NOTIFICATION",
  "data": {
    "id": 1,
    "type": "POST_COMMENT",
    "content": "Nguyễn Văn A đã bình luận bài viết của bạn.",
    "createdAt": "2026-06-17T10:00:00"
  }
}
```

---

# Frontend

## Notification Bell

Hiển thị icon chuông trên thanh điều hướng.

Ví dụ:

```text
🔔 (12)
```

Trong đó:

* Badge hiển thị số lượng thông báo chưa đọc.
* Badge tự động cập nhật real-time.

---

## Notification Dropdown

Khi click icon chuông:

Hiển thị danh sách thông báo mới nhất.

Ví dụ:

```text
Nguyễn Văn A đã thích bài viết của bạn.
5 phút trước

Nguyễn Văn B đã gửi lời mời kết bạn.
10 phút trước

Nguyễn Văn C đã bình luận bài viết của bạn.
30 phút trước
```

Thông tin hiển thị:

* Avatar người gửi.
* Nội dung thông báo.
* Thời gian.
* Trạng thái đã đọc/chưa đọc.

---

## Nút See All

Hiển thị phía dưới dropdown notification.

Khi click:

```text
See All
```

Điều hướng đến:

```text
/notifications
```

Trang này hiển thị:

* Toàn bộ thông báo.
* Phân trang hoặc Infinite Scroll.
* Hỗ trợ đánh dấu đã đọc.

---

# Điều hướng theo loại Notification

| Type            | Redirect                 |
| --------------- | ------------------------ |
| FRIEND_REQUEST  | Friend Request Page      |
| FRIEND_ACCEPTED | User Profile             |
| POST_LIKE       | Post Detail              |
| POST_COMMENT    | Post Detail              |
| COMMENT_REPLY   | Post Detail              |
| MENTION         | Post Detail              |
| SYSTEM          | System Notification Page |

---

# Quy tắc tạo Notification

## Khi gửi lời mời kết bạn

Tạo notification cho người nhận:

```text
Nguyễn Văn A đã gửi cho bạn lời mời kết bạn.
```

Đồng thời phát sự kiện WebSocket real-time.

---

## Khi chấp nhận lời mời kết bạn

Tạo notification cho người gửi lời mời:

```text
Nguyễn Văn B đã chấp nhận lời mời kết bạn của bạn.
```

Đồng thời phát sự kiện WebSocket real-time.

---

## Khi thích bài viết

Tạo notification cho chủ bài viết.

Không tạo notification nếu người thích là chủ bài viết.

---

## Khi bình luận bài viết

Tạo notification cho chủ bài viết.

Không tạo notification nếu người bình luận là chủ bài viết.

---

## Khi trả lời bình luận

Tạo notification cho chủ comment gốc.

---

## Khi mention người dùng

Tạo notification cho người được mention.

---

# Tối ưu hiệu năng

* Chỉ lấy 20 thông báo gần nhất cho dropdown notification.
* Danh sách notification hỗ trợ phân trang.
* Chỉ cập nhật badge unread count khi có thay đổi.
* Sử dụng WebSocket để tránh polling liên tục.
* Có thể thực hiện lazy loading khi mở dropdown notification.

---

# Acceptance Criteria

* Người dùng nhận được thông báo ngay khi có sự kiện mới.
* Badge số lượng chưa đọc cập nhật real-time.
* Có dropdown notification trên header.
* Có trang xem toàn bộ notification.
* Hỗ trợ đánh dấu đã đọc.
* Hỗ trợ đánh dấu tất cả đã đọc.
* Điều hướng đúng đến đối tượng liên quan.
* Không cần reload trang để nhận thông báo mới.
* Hoạt động ổn định khi có nhiều thông báo đồng thời.
