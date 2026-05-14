# Database Description — Social Platform

> Tài liệu mô tả chi tiết mục đích, nghiệp vụ và lưu ý kỹ thuật cho toàn bộ 33 bảng của hệ thống Social Platform với WebSocket nâng cao.

---

## Mục lục

1. [Auth & User](#1-auth--user)
2. [Social Graph](#2-social-graph)
3. [Content](#3-content)
4. [Engagement](#4-engagement)
5. [Messaging](#5-messaging)
6. [Notifications](#6-notifications)
7. [WebSocket & Ops](#7-websocket--ops)

---

## 1. Auth & User

Nhóm bảng quản lý danh tính, xác thực và phân quyền người dùng. Đây là nền tảng của toàn bộ hệ thống — mọi bảng khác đều tham chiếu về `USERS`.

---

### USERS

**Mục đích:** Bảng trung tâm lưu thông tin xác thực của người dùng. Tách biệt hoàn toàn với thông tin cá nhân (nằm ở `PROFILES`) để dễ dàng mở rộng các phương thức đăng nhập (OAuth, SSO) mà không ảnh hưởng đến dữ liệu profile.

**Nghiệp vụ quan trọng:**
- `status` kiểm soát khả năng truy cập: `active` cho phép đăng nhập bình thường, `inactive` tài khoản chưa xác thực email, `banned` bị khóa vĩnh viễn.
- `email_verified_at` dùng để gate các tính năng yêu cầu xác thực email (đăng bài, nhắn tin).
- `deleted_at` áp dụng soft delete — dữ liệu không bị xóa vật lý, hỗ trợ khôi phục tài khoản và audit.
- `password` nên được hash bằng bcrypt/argon2 trước khi lưu, không bao giờ lưu plain text.

**Lưu ý kỹ thuật:** Index trên `email` (UNIQUE), `status`, và `deleted_at`. Query luôn thêm `WHERE deleted_at IS NULL` trừ khi cần truy xuất tài khoản đã xóa.

---

### PROFILES

**Mục đích:** Lưu thông tin cá nhân hiển thị công khai của người dùng. Tách riêng khỏi `USERS` theo nguyên tắc Single Responsibility — `USERS` phục vụ auth, `PROFILES` phục vụ display.

**Nghiệp vụ quan trọng:**
- Được tạo tự động khi user đăng ký (có thể qua trigger hoặc application logic).
- `avatar_url` trỏ đến CDN, không lưu binary trực tiếp trong DB.
- `language` và `timezone` dùng để localize nội dung và thông báo theo từng user.
- `bio` là mô tả ngắn hiển thị trên trang profile công khai.

**Quan hệ:** 1-1 với `USERS`. Mỗi user có đúng một profile.

---

### ROLES

**Mục đích:** Định nghĩa các vai trò trong hệ thống theo mô hình RBAC (Role-Based Access Control). Ví dụ: `admin`, `editor`, `moderator`, `member`.

**Nghiệp vụ quan trọng:**
- Roles được assign cho user thông qua bảng pivot `USER_ROLES`.
- Một user có thể có nhiều roles cùng lúc (ví dụ vừa là `editor` vừa là `moderator`).
- `name` là định danh kỹ thuật (dùng trong code), `description` là mô tả cho admin hiểu.

---

### PERMISSIONS

**Mục đích:** Định nghĩa các quyền hạn cụ thể trong hệ thống. Ví dụ: `article:publish`, `comment:delete`, `user:ban`.

**Nghiệp vụ quan trọng:**
- `code` theo chuẩn `resource:action` để dễ kiểm tra trong middleware.
- Permissions được gán vào Roles (không gán trực tiếp cho User) — đây là điểm khác biệt với ABAC.
- Khi check permission, middleware load roles của user → load permissions của từng role → kiểm tra code.

**Lưu ý kỹ thuật:** Nên cache permission set theo user_id vào Redis để tránh query DB mỗi request. TTL ~5 phút, invalidate khi role thay đổi.

---

### USER_ROLES *(pivot)*

**Mục đích:** Bảng trung gian liên kết nhiều-nhiều giữa `USERS` và `ROLES`.

**Nghiệp vụ quan trọng:**
- Composite PK `(user_id, role_id)` đảm bảo mỗi user chỉ có một role cụ thể một lần.
- Khi revoke role, xóa row tương ứng.
- Nên log thao tác gán/thu hồi role vào `AUDIT_LOGS` để truy vết.

---

### ROLE_PERMISSIONS *(pivot)*

**Mục đích:** Bảng trung gian liên kết nhiều-nhiều giữa `ROLES` và `PERMISSIONS`.

**Nghiệp vụ quan trọng:**
- Cho phép tái sử dụng permissions across roles. Ví dụ permission `comment:delete` có thể thuộc cả `admin` lẫn `moderator`.
- Thay đổi permissions của role ảnh hưởng ngay tới tất cả users có role đó.

---

### REFRESH_TOKENS

**Mục đích:** Lưu refresh token của người dùng phục vụ cơ chế JWT rotate — khi access token hết hạn, dùng refresh token để lấy access token mới mà không cần đăng nhập lại.

**Nghiệp vụ quan trọng:**
- `token_hash` lưu hash của token (bcrypt hoặc SHA-256), không bao giờ lưu raw token.
- `expires_at` xác định thời hạn sống của token (thường 7–30 ngày).
- `revoked_at` dùng cho logout hoặc force-logout tất cả thiết bị — set timestamp thay vì xóa row để có lịch sử.
- `device_info` và `ip_address` hỗ trợ tính năng "Quản lý thiết bị đăng nhập".
- Một user có thể có nhiều refresh tokens cùng lúc (multi-device).

**Lưu ý kỹ thuật:** Cron job định kỳ xóa các token đã hết hạn hoặc bị revoke quá 30 ngày để tránh bảng phình to.

---

## 2. Social Graph

Nhóm bảng quản lý mối quan hệ xã hội giữa người dùng. Đây là cốt lõi của tính năng social — theo dõi, chặn, và trạng thái hiển thị.

---

### FOLLOWS

**Mục đích:** Lưu quan hệ follow một chiều giữa hai người dùng. Người dùng A follow B không có nghĩa B follow lại A (khác với friendship hai chiều).

**Nghiệp vụ quan trọng:**
- `follower_id` là người đi follow, `following_id` là người được follow.
- `status` hỗ trợ tài khoản private: khi account bật chế độ private, follow mới sẽ ở trạng thái `pending` cho đến khi được chấp nhận (`active`).
- Constraint `follower_id ≠ following_id` ngăn user tự follow chính mình.
- Khi follow thành công, trigger cập nhật `USER_STATS.follower_count` và `USER_STATS.following_count`.
- Khi follow mới, tạo event đẩy lên feed của người được follow.

**Lưu ý kỹ thuật:** Index trên `(following_id, status)` để query "ai đang follow mình" nhanh. Index trên `(follower_id, status)` để query "mình đang follow ai".

---

### BLOCKS

**Mục đích:** Lưu danh sách chặn giữa người dùng. Khi A block B, B không thể xem profile, bài viết, hay tương tác với A.

**Nghiệp vụ quan trọng:**
- Block có hiệu lực hai chiều về mặt hiển thị: A không thấy B trong feed và ngược lại.
- Khi block, tự động xóa follow relationship nếu tồn tại.
- `reason` không bắt buộc, nhưng hữu ích để phân tích hành vi người dùng.
- Danh sách block phải được check ở tầng query feed, comments, search — không check ở application layer để tránh miss.

**Lưu ý kỹ thuật:** Load danh sách block của user vào Redis khi login (Set structure), TTL theo session. Dùng set để O(1) check "is blocked?".

---

### USER_STATS

**Mục đích:** Bảng cache lưu các số liệu thống kê thường xuyên được query của user, tránh phải thực hiện COUNT(*) nặng mỗi lần load profile.

**Nghiệp vụ quan trọng:**
- `follower_count`, `following_count`, `article_count` được cập nhật qua database trigger hoặc background job sau mỗi sự kiện tương ứng.
- Mỗi user có đúng một row — được tạo cùng lúc với USERS.
- Đây là nguồn truth duy nhất cho counter — không nên COUNT trực tiếp từ FOLLOWS hay ARTICLES trong production.

**Lưu ý kỹ thuật:** Trong trường hợp dữ liệu bị lệch (drift), có thể chạy reconciliation job định kỳ để sync lại từ source tables.

---

### USER_PRESENCE

**Mục đích:** Lưu trạng thái online của người dùng theo thời gian thực, phục vụ tính năng hiển thị "đang online", "vừa trực tuyến", "bận".

**Nghiệp vụ quan trọng:**
- `status` gồm: `online` (đang kết nối WS), `away` (không hoạt động quá 5 phút), `busy` (tự đặt), `offline` (không có kết nối WS nào).
- `is_invisible` cho phép user online mà không bị người khác thấy.
- `last_seen_at` cập nhật mỗi khi nhận heartbeat ping từ client — hiển thị "online 5 phút trước".
- Luồng update: WebSocket server nhận heartbeat → cập nhật Redis (TTL 30s) → khi disconnect hoặc TTL expire, persist `last_seen_at` vào DB và set status `offline`.
- `custom_status` là text ngắn user tự đặt, ví dụ "Đang tập trung làm việc 🎯".

**Lưu ý kỹ thuật:** DB chỉ là persistent store, source of truth cho realtime là Redis. Không query DB cho presence check — luôn đọc từ Redis.

---

## 3. Content

Nhóm bảng quản lý toàn bộ nội dung bài viết, phân loại, gắn nhãn và SEO. Đây là core business của nền tảng.

---

### SEO_META

**Mục đích:** Lưu metadata SEO dùng chung cho nhiều loại entity — hiện tại là `ARTICLES` và `CATEGORIES`. Tách riêng thành bảng để tái sử dụng và dễ quản lý.

**Nghiệp vụ quan trọng:**
- Các field `og_*` phục vụ Open Graph — hiển thị preview khi share link lên mạng xã hội.
- `canonical_url` quan trọng khi có nhiều URL dẫn đến cùng nội dung, giúp tránh duplicate content penalty từ Google.
- `meta_keywords` ít quan trọng với SEO hiện đại nhưng vẫn giữ để tương thích.

---

### CATEGORIES

**Mục đích:** Phân loại bài viết theo chủ đề. Hỗ trợ cấu trúc cây (nested categories) thông qua self-referencing.

**Nghiệp vụ quan trọng:**
- `parent_id` NULL nghĩa là category gốc (root). Không giới hạn số cấp, nhưng khuyến nghị tối đa 3 cấp để UX tốt.
- `slug` dùng để build URL thân thiện SEO, ví dụ `/category/cong-nghe/lap-trinh`.
- Mỗi category có thể gắn `SEO_META` riêng để tối ưu trang danh mục.
- Khi xóa category, cần xử lý bài viết thuộc category đó: chuyển về uncategorized hoặc xóa cascade.

**Lưu ý kỹ thuật:** Dùng Adjacency List (cột `parent_id`) đơn giản, phù hợp cho cây nhỏ. Nếu cần query subtree phức tạp, có thể chuyển sang Nested Set hoặc dùng recursive CTE của PostgreSQL.

---

### TAGS

**Mục đích:** Nhãn phân loại nhẹ hơn CATEGORIES — không có cấu trúc cây, không bắt buộc gắn vào bài viết. Người dùng thường tự tạo tag khi viết bài.

**Nghiệp vụ quan trọng:**
- Tags là flat list, không có quan hệ cha-con.
- Khác với HASHTAGS ở chỗ: Tags do editor/admin quản lý, có slug cố định; Hashtags do người dùng tạo tự do trong nội dung bài viết.
- `slug` dùng cho URL trang tag, ví dụ `/tag/nodejs`.

---

### HASHTAGS

**Mục đích:** Lưu các hashtag được sử dụng trong bài viết, phục vụ tính năng trending và tìm kiếm theo hashtag kiểu mạng xã hội.

**Nghiệp vụ quan trọng:**
- Hashtags được tự động extract từ nội dung bài viết khi đăng hoặc cập nhật.
- `trending_score` được tính theo thuật toán time-decay: score tăng khi có bài viết mới dùng hashtag, giảm dần theo thời gian. Công thức tham khảo: `score = usage_count / (age_in_hours + 2)^gravity`.
- `usage_count` cập nhật mỗi khi có bài viết mới gắn hashtag này.
- Trending hashtags được cache vào Redis, recalculate mỗi 5–15 phút.

---

### ARTICLES

**Mục đích:** Bảng trung tâm của hệ thống content — lưu metadata của bài viết. Nội dung thực tế (title, body) được lưu tách biệt trong `ARTICLE_VERSIONS` để hỗ trợ versioning.

**Nghiệp vụ quan trọng:**
- `current_version_id` trỏ đến phiên bản đang hiển thị công khai. Khi editor submit version mới và được approve, chỉ cần update field này.
- `status` điều khiển vòng đời bài viết: `draft` → `review` → `published` → `archived`.
- `published_at` có thể là tương lai để hỗ trợ scheduled publishing.
- `view_count` là counter cache, cập nhật qua debounce (không update mỗi pageview để tránh write storm). Realtime counter chạy trên Redis, flush vào DB định kỳ.
- `deleted_at` cho phép soft delete — bài viết bị xóa vẫn giữ nguyên trong DB để audit và khôi phục.

**Lưu ý kỹ thuật:** Index trên `(author_id, status, published_at)` cho query "bài viết đã đăng của tác giả X". Index trên `(category_id, status, published_at)` cho trang category.

---

### ARTICLE_VERSIONS

**Mục đích:** Lưu toàn bộ lịch sử phiên bản của mỗi bài viết. Đây là nơi thực sự chứa nội dung — title, body, excerpt.

**Nghiệp vụ quan trọng:**
- Mỗi lần editor lưu draft hoặc submit để review, một version mới được tạo — không bao giờ overwrite version cũ.
- `created_by` là người tạo version (có thể là author hoặc co-author).
- `reviewed_by` là moderator/editor review và quyết định approve/reject.
- `review_note` cho phép reviewer để lại phản hồi cho tác giả.
- `status` của version: `draft` (đang soạn), `review` (đang chờ duyệt), `approved` (được chấp nhận), `rejected` (bị từ chối kèm lý do).

**Lưu ý kỹ thuật:** Bảng này sẽ lớn theo thời gian. Cân nhắc partition theo `created_at` (range partitioning) hoặc lưu nội dung cũ hơn 1 năm vào cold storage.

---

### ARTICLE_ASSETS

**Mục đích:** Quản lý các file đính kèm (ảnh, video, tài liệu) được upload lên cùng bài viết.

**Nghiệp vụ quan trọng:**
- `file_url` là CDN URL, file thực tế được lưu trên object storage (S3, GCS).
- `size` tính bằng bytes, dùng để kiểm soát quota storage của user.
- Khi bài viết bị xóa (soft delete), assets vẫn giữ nguyên cho đến khi có job cleanup chạy sau 30 ngày.
- Nên scan file khi upload (virus scan, content moderation) trước khi lưu URL vào bảng này.

---

### ARTICLE_TAGS *(pivot)*

**Mục đích:** Liên kết nhiều-nhiều giữa bài viết và tags — một bài có nhiều tags, một tag gắn vào nhiều bài.

**Nghiệp vụ quan trọng:**
- Giới hạn tối đa 10 tags mỗi bài để tránh spam và giữ chất lượng phân loại.
- Khi thêm/xóa tag của bài viết, không update ARTICLES.updated_at để tránh đẩy bài lên đầu feed.

---

### ARTICLE_HASHTAGS *(pivot)*

**Mục đích:** Liên kết nhiều-nhiều giữa bài viết và hashtags. Tách riêng khỏi ARTICLE_TAGS vì hashtag có logic khác (auto-extract, trending score).

**Nghiệp vụ quan trọng:**
- Được populate tự động khi parse nội dung bài viết, extract các chuỗi bắt đầu bằng `#`.
- Cũng được cập nhật lại mỗi khi article version mới được approve.
- Khi insert row mới, trigger cập nhật `HASHTAGS.usage_count` và `HASHTAGS.last_used_at`.

---

## 4. Engagement

Nhóm bảng theo dõi sự tương tác của người dùng với nội dung: bình luận, reaction, bookmark, feed và analytics.

---

### COMMENTS

**Mục đích:** Lưu bình luận của người dùng trên bài viết. Hỗ trợ nested comments (reply) thông qua self-referencing.

**Nghiệp vụ quan trọng:**
- `parent_id` NULL nghĩa là top-level comment. Có `parent_id` nghĩa là reply cho comment đó.
- Khuyến nghị giới hạn 1 cấp reply (reply chỉ được với top-level comment) để tránh UX phức tạp, nhưng schema hỗ trợ đa cấp nếu cần.
- Khi post comment, tạo notification cho: tác giả bài viết (nếu là top-level), người viết comment gốc (nếu là reply).
- Nên có content moderation (filter từ ngữ độc hại) trước khi lưu.

**Lưu ý kỹ thuật:** Index trên `(article_id, parent_id, created_at)` cho query thread comments hiệu quả.

---

### REACTIONS

**Mục đích:** Lưu các reaction (like, love, clap...) của người dùng trên bài viết hoặc comment. Thiết kế polymorphic để một bảng phục vụ nhiều loại entity.

**Nghiệp vụ quan trọng:**
- `target_type` và `target_id` là cặp polymorphic reference — `target_type = 'article'` thì `target_id` là ID của article.
- UNIQUE constraint `(user_id, target_type, target_id, type)` ngăn react trùng, nhưng cho phép cùng người dùng react nhiều loại khác nhau trên cùng bài.
- Nếu muốn giới hạn mỗi user chỉ 1 reaction trên mỗi bài, đổi UNIQUE thành `(user_id, target_type, target_id)`.

**Lưu ý kỹ thuật:** Index trên `(target_type, target_id)` để đếm tổng reactions của một entity nhanh.

---

### FEEDS

**Mục đích:** Bảng hiện thực hoá thuật toán feed theo mô hình fanout-on-write — khi user A đăng bài, tạo một row trong FEEDS cho mỗi follower của A.

**Nghiệp vụ quan trọng:**
- `user_id` là người sở hữu feed (nhìn thấy bài này trong home feed của họ).
- `actor_id` là người thực hiện hành động (đăng bài, follow, react...).
- `entity_type` + `entity_id` trỏ đến nội dung cụ thể.
- `score` là trọng số ranking, có thể điều chỉnh theo engagement, thời gian, mức độ thân thiết.
- Với user có ít follower: fanout đồng bộ. Với celebrity (>10,000 followers): fanout bất đồng bộ qua queue.

**Lưu ý kỹ thuật:** Partition bảng theo `user_id` (hash) hoặc `created_at` (range). Cần cron job xóa feed items cũ hơn 30–90 ngày để kiểm soát kích thước bảng.

---

### BOOKMARKS

**Mục đích:** Cho phép người dùng lưu lại bài viết để đọc sau, có thể tổ chức vào collections.

**Nghiệp vụ quan trọng:**
- UNIQUE `(user_id, article_id)` đảm bảo không bookmark trùng.
- `collection_id` nullable — bookmark có thể không thuộc collection nào (uncategorized).
- Khi xóa collection, các bookmark trong đó chuyển về uncategorized (set `collection_id = NULL`), không bị xóa cascade.

---

### BOOKMARK_COLLECTIONS

**Mục đích:** Folder/danh sách do người dùng tự tạo để tổ chức bookmarks. Ví dụ: "Đọc cuối tuần", "Tài liệu học", "Bài hay về AI".

**Nghiệp vụ quan trọng:**
- Mỗi collection thuộc về 1 user, private by default.
- Không giới hạn số lượng collections mỗi user (có thể thêm limit sau theo plan).

---

### ARTICLE_ANALYTICS

**Mục đích:** Thu thập dữ liệu hành vi đọc bài của từng phiên — thời gian đọc, mức độ cuộn trang, nguồn traffic. Phục vụ dashboard analytics cho tác giả.

**Nghiệp vụ quan trọng:**
- `user_id` nullable vì hỗ trợ anonymous tracking (dùng `session_id` để identify).
- `read_time_seconds` được gửi từ frontend qua heartbeat event mỗi 10–30 giây khi user đang đọc bài.
- `scroll_depth_pct` ghi nhận user đọc đến bao nhiêu % bài viết — chỉ số chất lượng tốt hơn pageview đơn thuần.
- `referrer` cho biết user đến từ đâu: Google Search, Facebook, direct...

**Lưu ý kỹ thuật:** Bảng này tăng trưởng rất nhanh. Cần partition theo `created_at` (monthly). Dữ liệu raw có thể được aggregate vào bảng summary sau 30 ngày để tiết kiệm storage.

---

## 5. Messaging

Nhóm bảng phục vụ tính năng nhắn tin trực tiếp (DM) và group chat theo thời gian thực qua WebSocket.

---

### CONVERSATIONS

**Mục đích:** Đại diện cho một cuộc hội thoại — có thể là DM giữa 2 người hoặc group chat nhiều người.

**Nghiệp vụ quan trọng:**
- `type = 'direct'`: cuộc trò chuyện 1-1, không có name và avatar riêng.
- `type = 'group'`: chat nhóm, có thể đặt tên nhóm và ảnh đại diện nhóm.
- `last_message_id` là denormalized pointer để hiển thị preview tin nhắn cuối trên danh sách conversations mà không cần JOIN.
- `created_by` là người khởi tạo conversation — mặc định là admin của group.
- Khi tạo DM, cần check đã tồn tại conversation giữa 2 user chưa (tránh tạo trùng).

---

### CONVERSATION_PARTICIPANTS

**Mục đích:** Quản lý thành viên của từng conversation, vai trò và trạng thái của họ trong hội thoại.

**Nghiệp vụ quan trọng:**
- `role = 'admin'` có quyền thêm/xóa thành viên, đổi tên nhóm, giải tán nhóm.
- `last_read_message_id` là cơ chế đơn giản để tính unread count: đếm số messages có `id > last_read_message_id` trong conversation.
- `is_muted` cho phép tắt thông báo của conversation đó mà không rời nhóm.
- Khi user bị block bởi người khác trong group, cần xử lý riêng ở tầng application (không expose message của người bị block).

---

### MESSAGES

**Mục đích:** Lưu từng tin nhắn trong conversations. Hỗ trợ reply, chỉnh sửa, xóa mềm và nhiều loại nội dung.

**Nghiệp vụ quan trọng:**
- `reply_to_id` tham chiếu message khác trong cùng conversation để hiển thị context trả lời.
- `type` xác định cách render: `text` hiển thị text, `image` hiển thị ảnh inline, `file` hiển thị attachment, `system` là tin nhắn hệ thống (ví dụ "John đã thêm Mary vào nhóm").
- `edited_at` khác NULL khi message đã bị sửa — hiển thị dấu "(đã chỉnh sửa)".
- `deleted_at` là soft delete — message bị xóa vẫn còn row, chỉ hiển thị "Tin nhắn đã bị thu hồi".
- Mỗi message mới gửi thành công phải broadcast qua WebSocket đến tất cả participants đang online, đồng thời gửi push notification cho participants đang offline.

**Lưu ý kỹ thuật:** Index trên `(conversation_id, created_at DESC)` để paginate messages hiệu quả (load more theo cursor).

---

### MESSAGE_REACTIONS

**Mục đích:** Cho phép người dùng react (emoji) lên từng tin nhắn trong chat.

**Nghiệp vụ quan trọng:**
- Composite PK `(message_id, user_id, emoji)` cho phép cùng một người react nhiều emoji khác nhau lên cùng một message, nhưng không được react trùng emoji.
- Khi react, broadcast event `message:reaction` đến conversation room qua WebSocket để cập nhật realtime cho tất cả participants.
- Frontend hiển thị reaction count theo từng emoji (aggregate tại application layer hoặc Redis).

---

## 6. Notifications

Nhóm bảng quản lý hệ thống thông báo đa kênh: WebSocket (realtime), push notification (FCM/APNs) và email.

---

### NOTIFICATIONS

**Mục đích:** Lưu tất cả thông báo gửi đến người dùng — new follower, new comment, new message, article approved...

**Nghiệp vụ quan trọng:**
- `type` là định danh loại thông báo theo chuẩn `resource.event`, ví dụ: `article.comment`, `user.follow`, `message.new`.
- `payload` là JSON linh hoạt chứa dữ liệu cần thiết để render thông báo (tên người, title bài viết, avatar...) mà không cần JOIN nhiều bảng.
- `read_at` NULL nghĩa là chưa đọc. Update timestamp khi user click vào notification.
- Unread count = `COUNT(*) WHERE user_id = ? AND read_at IS NULL` — nên cache vào Redis và decrement khi đọc.

**Lưu ý kỹ thuật:** Nên có TTL cleanup — xóa notifications cũ hơn 90 ngày để kiểm soát kích thước bảng.

---

### NOTIFICATION_PREFERENCES

**Mục đích:** Cấu hình chi tiết của từng user về việc nhận thông báo — loại nào qua kênh nào, giờ nào không làm phiền.

**Nghiệp vụ quan trọng:**
- `notification_type` kết hợp với `user_id` tạo composite PK — mỗi user có setting riêng cho từng loại thông báo.
- `via_push`, `via_email`, `via_websocket` cho phép user tắt từng kênh riêng lẻ.
- `quiet_hours_start` / `quiet_hours_end` định nghĩa khung giờ không gửi push (thường 22:00–08:00). Trong giờ này, notifications vẫn lưu DB nhưng không gửi push/email — gom lại và gửi sau khi hết quiet hours.
- Nếu user chưa có row cho một `notification_type`, fallback về default (tất cả kênh bật).

---

### PUSH_TOKENS

**Mục đích:** Lưu device token của từng thiết bị để gửi push notification qua FCM (Android) và APNs (iOS) khi user offline.

**Nghiệp vụ quan trọng:**
- Mỗi thiết bị có token riêng — một user nhiều thiết bị = nhiều rows.
- Token FCM/APNs có thể thay đổi hoặc expire. Khi gửi push thất bại với lỗi "invalid token", set `is_active = false`.
- `last_used_at` cập nhật mỗi lần gửi push thành công — dùng để cleanup tokens inactive quá 60 ngày.
- `platform = 'web'` là Web Push API (trình duyệt), khác với FCM và APNs.

---

## 7. WebSocket & Ops

Nhóm bảng hỗ trợ vận hành hệ thống: quản lý kết nối WebSocket, kiểm duyệt nội dung vi phạm, và audit trail.

---

### WS_CONNECTIONS

**Mục đích:** Track các kết nối WebSocket đang hoạt động của người dùng theo thời gian thực. Là nền tảng cho hệ thống multi-node WebSocket với Redis Pub/Sub.

**Nghiệp vụ quan trọng:**
- Mỗi tab trình duyệt hoặc thiết bị tạo một row riêng — user có thể online trên nhiều thiết bị đồng thời.
- `socket_id` là ID duy nhất được cấp bởi WS server khi client kết nối.
- `server_id` xác định WS server node nào đang giữ kết nối này — quan trọng trong môi trường multi-node để route message đúng node.
- `last_ping_at` cập nhật mỗi heartbeat (mỗi 15–30 giây). Nếu `last_ping_at` cũ hơn 60 giây, coi như connection đã chết → cleanup.
- Khi user disconnect (bình thường hoặc bất thường), xóa row và update `USER_PRESENCE`.

**Lưu ý kỹ thuật:** Bảng này cần được đọc/ghi rất nhanh. Cân nhắc dùng Redis thay vì DB cho production nếu số lượng concurrent connections lớn (>100K). DB chỉ dùng để audit và reconciliation.

---

### REPORTS

**Mục đích:** Lưu các báo cáo vi phạm do người dùng gửi lên về bài viết, bình luận, hoặc tài khoản khác — phục vụ quy trình kiểm duyệt nội dung (content moderation).

**Nghiệp vụ quan trọng:**
- `target_type` + `target_id` là polymorphic reference — report có thể nhắm vào article, comment, hoặc user.
- `status` điều khiển quy trình xử lý: `pending` (chưa xét), `reviewed` (đã xem xét và có action), `dismissed` (bác bỏ báo cáo).
- `reviewed_by` là moderator xử lý report — nullable khi chưa có ai nhận case.
- Một nội dung có thể nhận nhiều reports từ nhiều người khác nhau — hiển thị "đã có X người báo cáo".
- Khi report được xử lý, gửi notification cho `reporter_id` về kết quả.

**Lưu ý kỹ thuật:** Index trên `(status, created_at)` để moderator load queue "báo cáo chưa xử lý" theo thứ tự thời gian.

---

### AUDIT_LOGS

**Mục đích:** Ghi lại mọi hành động quan trọng trong hệ thống — ai làm gì, với entity nào, dữ liệu thay đổi ra sao. Phục vụ debugging, security audit, và compliance.

**Nghiệp vụ quan trọng:**
- `action` mô tả hành động theo chuẩn `resource.verb`, ví dụ: `article.publish`, `user.ban`, `role.assign`.
- `entity` + `entity_id` xác định đối tượng bị tác động.
- `old_value` và `new_value` lưu snapshot JSON trước và sau khi thay đổi — cho phép rollback hoặc diff trực quan.
- Không bao giờ update hay delete row trong bảng này — append-only.
- Các hành động quan trọng cần log: đăng nhập/đăng xuất, thay đổi role, publish/unpublish bài, ban user, xóa nội dung, thay đổi settings hệ thống.

**Lưu ý kỹ thuật:** Bảng này sẽ rất lớn. Partition theo `created_at` (monthly range). Sau 1 năm, có thể archive sang cold storage. Không dùng để realtime query — chỉ dùng cho audit và điều tra sự cố.

---

## Tổng kết

| Nhóm | Số bảng | Vai trò chính |
|------|---------|---------------|
| Auth & User | 7 | Danh tính, xác thực, phân quyền RBAC |
| Social Graph | 4 | Follow, block, presence, counter cache |
| Content | 9 | Bài viết, versioning, phân loại, SEO |
| Engagement | 6 | Tương tác, feed, bookmark, analytics |
| Messaging | 4 | Chat realtime DM và group |
| Notifications | 3 | Thông báo đa kênh, push token |
| WebSocket & Ops | 3 | Kết nối WS, kiểm duyệt, audit |
| **Tổng** | **33** | |

---

*Tài liệu này được tạo từ `social_platform_schema.md` — Social Platform với WebSocket nâng cao*
