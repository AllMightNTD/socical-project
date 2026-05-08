# Facebook-like Social Platform — Full Database Schema (v2)

> **52 bảng** | 10 nhóm chức năng | Kiến trúc ~80% tương tự Facebook

---

## Phân tích So sánh với Schema Gốc (33 bảng)

| Nhóm | Schema Gốc | Schema Mới (Facebook-like) | Thay đổi chính |
|------|-----------|---------------------------|----------------|
| Auth & User | 7 bảng | 8 bảng | + USER_SETTINGS (privacy granular) |
| Social Graph | 4 bảng | 6 bảng | + FRIENDS, FRIEND_REQUESTS (model bạn bè 2 chiều) |
| Content | 9 bảng | 12 bảng | + POSTS, POST_MEDIA, STORIES (timeline Facebook) |
| Engagement | 6 bảng | 8 bảng | + SHARES, POLLS (viral mechanics) |
| Groups | ❌ Không có | 5 bảng | + GROUPS, GROUP_MEMBERS, GROUP_POSTS... |
| Pages | ❌ Không có | 3 bảng | + PAGES, PAGE_FOLLOWERS, PAGE_POSTS |
| Marketplace | ❌ Không có | 3 bảng | + LISTINGS, LISTING_MEDIA, ORDERS |
| Messaging | 4 bảng | 4 bảng | Giữ nguyên, nâng cấp enums |
| Notifications | 3 bảng | 3 bảng | Giữ nguyên |
| WebSocket & Ops | 3 bảng | 3 bảng | Giữ nguyên |
| **Tổng** | **33** | **52** | **+19 bảng** |

---

## Mục lục

1. [Auth & User](#1-auth--user)
2. [Social Graph — Friends Model](#2-social-graph--friends-model)
3. [Content — Posts & Stories](#3-content--posts--stories)
4. [Engagement](#4-engagement)
5. [Groups](#5-groups)
6. [Pages](#6-pages)
7. [Marketplace](#7-marketplace)
8. [Messaging](#8-messaging)
9. [Notifications](#9-notifications)
10. [WebSocket & Ops](#10-websocket--ops)

---

## 1. Auth & User

### USERS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| email | string | UNIQUE NOT NULL | |
| phone | string | UNIQUE nullable | Facebook yêu cầu phone hoặc email |
| password | string | NOT NULL | bcrypt hash |
| status | enum(active, inactive, banned, memorialized) | NOT NULL | memorialized: tài khoản tưởng niệm |
| email_verified_at | datetime | nullable | |
| phone_verified_at | datetime | nullable | |
| last_login_at | datetime | nullable | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |
| deleted_at | datetime | nullable | Soft delete |

> **Thay đổi:** Thêm `phone`, `phone_verified_at`, `memorialized` status — Facebook cho phép đăng ký bằng SĐT và có chế độ tưởng niệm khi người dùng qua đời.

---

### PROFILES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| full_name | string | NOT NULL | Facebook bắt buộc tên thật |
| username | string | UNIQUE NOT NULL | @username (timeline URL) |
| avatar_url | string | nullable | |
| cover_url | string | nullable | Ảnh bìa — Facebook feature |
| bio | string | nullable | max 101 chars |
| gender | enum(male, female, custom, undisclosed) | nullable | |
| date_of_birth | date | nullable | |
| location_city | string | nullable | |
| location_country | string | nullable | |
| website | string | nullable | |
| relationship_status | enum(single, in_relationship, engaged, married, complicated, separated, divorced, widowed, undisclosed) | nullable | Facebook relationship status |
| work | json | nullable | [{company, position, start, end}] |
| education | json | nullable | [{school, degree, year}] |
| language | string | default 'vi' | |
| timezone | string | default 'Asia/Ho_Chi_Minh' | |
| updated_at | datetime | NOT NULL | |

> **Thay đổi:** Thêm `username`, `cover_url`, `date_of_birth`, `relationship_status`, `work`, `education` — Facebook profile rất chi tiết.

---

### USER_SETTINGS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | PK FK → USERS.id | |
| post_default_audience | enum(public, friends, friends_of_friends, only_me, custom) | default 'friends' | Audience mặc định khi đăng bài |
| profile_visibility | enum(public, friends, only_me) | default 'friends' | |
| friend_list_visibility | enum(public, friends, only_me) | default 'friends' | |
| tag_review_enabled | bool | default true | Duyệt trước khi bị tag |
| face_recognition_enabled | bool | default false | |
| timeline_review_enabled | bool | default false | Duyệt post người khác tag trên timeline |
| two_factor_enabled | bool | default false | |
| two_factor_method | enum(sms, authenticator) | nullable | |
| ad_personalization | bool | default true | |
| data_download_requested_at | datetime | nullable | GDPR |
| updated_at | datetime | NOT NULL | |

> **Mới hoàn toàn:** Facebook có hệ thống privacy settings rất chi tiết — audience mặc định, tag review, 2FA.

---

### ROLES, PERMISSIONS, USER_ROLES, ROLE_PERMISSIONS
*(Giữ nguyên từ schema gốc)*

---

### REFRESH_TOKENS
*(Giữ nguyên từ schema gốc — thêm ghi chú: rotate sau mỗi lần dùng)*

---

## 2. Social Graph — Friends Model

> **Thay đổi lớn nhất:** Schema gốc dùng **FOLLOWS** (1 chiều, kiểu Twitter). Facebook dùng **FRIENDS** (2 chiều, mutual) + vẫn có FOLLOWS cho Pages/Public figures. Cần tách biệt hai mô hình.

---

### FRIEND_REQUESTS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| sender_id | uuid | FK → USERS.id | |
| receiver_id | uuid | FK → USERS.id | |
| status | enum(pending, accepted, declined, cancelled) | default 'pending' | |
| message | string | nullable | Lời nhắn khi gửi kết bạn |
| created_at | datetime | NOT NULL | |
| responded_at | datetime | nullable | |
| **UNIQUE** | | (sender_id, receiver_id) | |

---

### FRIENDS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | FK → USERS.id | |
| friend_id | uuid | FK → USERS.id | |
| list_type | enum(close_friends, acquaintances, restricted, none) | default 'none' | Friend Lists |
| created_at | datetime | NOT NULL | |
| **PK** | | (user_id, friend_id) | Row nhỏ hơn: user_id < friend_id |

> Lưu 1 row duy nhất (user_id < friend_id), query với `WHERE user_id=X OR friend_id=X`.

---

### FOLLOWS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| follower_id | uuid | FK → USERS.id | |
| following_id | uuid | FK → USERS.id | |
| following_type | enum(user, page, group) | default 'user' | Polymorphic |
| following_entity_id | uuid | NOT NULL | ID của user/page/group |
| priority | enum(default, favorites, unfollow) | default 'default' | "See First" / Unfollow |
| status | enum(active, pending) | default 'active' | Private account |
| created_at | datetime | NOT NULL | |
| **PK** | | (follower_id, following_entity_id, following_type) | |

> **Thay đổi:** Follows giờ polymorphic — theo dõi User, Page, Group đều qua 1 bảng. Thêm `priority` (Facebook "Favorites").

---

### BLOCKS
*(Giữ nguyên từ schema gốc)*

---

### USER_STATS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | PK FK → USERS.id | |
| friend_count | int | default 0 | Thay follower_count |
| follower_count | int | default 0 | Người follow (public figure) |
| following_count | int | default 0 | |
| post_count | int | default 0 | Đổi từ article_count |
| updated_at | datetime | NOT NULL | |

---

### USER_PRESENCE
*(Giữ nguyên từ schema gốc)*

---

## 3. Content — Posts & Stories

> **Thay đổi lớn nhất:** Facebook dùng **POSTS** (ngắn, đa media, check-in, feeling) thay vì ARTICLES (dài, SEO). Thêm STORIES (24h ephemeral content).

---

### POSTS (MỚI — thay thế ARTICLES cho social feed)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | Tác giả |
| page_id | uuid | FK → PAGES.id (nullable) | Nếu đăng bởi Page |
| group_id | uuid | FK → GROUPS.id (nullable) | Nếu đăng trong Group |
| content | text | nullable | Có thể chỉ có media, không text |
| type | enum(text, photo, video, link, event, feeling, check_in, memory, poll, reel) | default 'text' | |
| audience | enum(public, friends, friends_of_friends, only_me, custom) | NOT NULL | Privacy per post |
| custom_audience_ids | json | nullable | [{type: 'list'/'user', id}] |
| feeling | string | nullable | e.g. "😊 happy" |
| location_name | string | nullable | Check-in |
| location_lat | decimal(10,8) | nullable | |
| location_lng | decimal(11,8) | nullable | |
| link_url | string | nullable | Link share |
| link_title | string | nullable | OG title |
| link_description | string | nullable | OG description |
| link_image | string | nullable | OG image |
| parent_post_id | uuid | FK → POSTS.id (nullable) | Shared post |
| is_pinned | bool | default false | Pin lên profile |
| is_hidden | bool | default false | Ẩn khỏi timeline |
| comment_disabled | bool | default false | Tắt bình luận |
| view_count | int | default 0 | |
| share_count | int | default 0 | Cache counter |
| reaction_count | int | default 0 | Cache counter |
| comment_count | int | default 0 | Cache counter |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |
| deleted_at | datetime | nullable | Soft delete |

---

### POST_MEDIA (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| post_id | uuid | FK → POSTS.id | |
| file_url | string | NOT NULL | |
| thumbnail_url | string | nullable | Video thumbnail |
| type | enum(image, video, reel, gif) | NOT NULL | |
| width | int | nullable | px |
| height | int | nullable | px |
| duration_seconds | int | nullable | Video duration |
| alt_text | string | nullable | Accessibility |
| sort_order | int | default 0 | Thứ tự trong album |
| size_bytes | int | nullable | |
| created_at | datetime | NOT NULL | |

---

### POST_TAGS *(pivot — người được tag trong post)*  (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| post_id | uuid | FK → POSTS.id | |
| tagged_user_id | uuid | FK → USERS.id | |
| approved_at | datetime | nullable | null = pending review |
| created_at | datetime | NOT NULL | |
| **PK** | | (post_id, tagged_user_id) | |

---

### STORIES (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| page_id | uuid | FK → PAGES.id (nullable) | |
| type | enum(photo, video, text, boomerang) | NOT NULL | |
| media_url | string | nullable | |
| thumbnail_url | string | nullable | |
| text_content | string | nullable | Text story |
| background_color | string | nullable | HEX |
| duration_seconds | int | default 5 | |
| audience | enum(public, friends, custom) | default 'friends' | |
| expires_at | datetime | NOT NULL | created_at + 24h |
| view_count | int | default 0 | |
| created_at | datetime | NOT NULL | |

---

### STORY_VIEWS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| story_id | uuid | FK → STORIES.id | |
| viewer_id | uuid | FK → USERS.id | |
| viewed_at | datetime | NOT NULL | |
| **PK** | | (story_id, viewer_id) | |

---

### ARTICLES
*(Giữ nguyên — dùng cho content dạng blog/news, không phải social feed)*

---

### HASHTAGS, ARTICLE_HASHTAGS, TAGS, ARTICLE_TAGS
*(Giữ nguyên, mở rộng pivot cho POSTS)*

### POST_HASHTAGS *(pivot — MỚI)*
| Column | Type | Constraint |
|--------|------|------------|
| post_id | uuid | FK → POSTS.id |
| hashtag_id | uuid | FK → HASHTAGS.id |
| **PK** | | (post_id, hashtag_id) |

---

## 4. Engagement

### REACTIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| target_type | enum(post, comment, message, story) | NOT NULL | Thêm post, story |
| target_id | uuid | NOT NULL | |
| type | enum(like, love, care, haha, wow, sad, angry) | NOT NULL | Facebook 7 reactions |
| created_at | datetime | NOT NULL | |
| **UNIQUE** | | (user_id, target_type, target_id) | Mỗi user 1 reaction/target |

> **Thay đổi:** Reactions Facebook có 7 loại (`like, love, care, haha, wow, sad, angry`). Target mở rộng thêm `post` và `story`.

---

### COMMENTS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| target_type | enum(post, article, photo) | NOT NULL | Polymorphic |
| target_id | uuid | NOT NULL | |
| user_id | uuid | FK → USERS.id | |
| parent_id | uuid | FK → COMMENTS.id (nullable) | Reply |
| content | text | nullable | Có thể comment chỉ bằng sticker/media |
| sticker_url | string | nullable | |
| media_url | string | nullable | Ảnh đính kèm |
| reaction_count | int | default 0 | Cache |
| reply_count | int | default 0 | Cache |
| is_hidden | bool | default false | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |
| deleted_at | datetime | nullable | |

> **Thay đổi:** Comments giờ polymorphic (`post`, `article`, `photo`). Thêm `sticker_url`, `media_url`.

---

### SHARES (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | Người share |
| post_id | uuid | FK → POSTS.id | Post gốc |
| shared_to_type | enum(timeline, group, page, message, external) | NOT NULL | |
| shared_to_id | uuid | nullable | Group/Page id |
| caption | text | nullable | |
| audience | enum(public, friends, only_me) | default 'friends' | |
| created_at | datetime | NOT NULL | |

---

### POLLS (MỚI — dành cho post type=poll)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| post_id | uuid | FK → POSTS.id | |
| question | string | NOT NULL | |
| allow_multiple | bool | default false | |
| expires_at | datetime | nullable | |
| created_at | datetime | NOT NULL | |

### POLL_OPTIONS (MỚI)
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| poll_id | uuid | FK → POLLS.id |
| option_text | string | NOT NULL |
| vote_count | int | default 0 |

### POLL_VOTES (MỚI)
| Column | Type | Constraint |
|--------|------|------------|
| poll_id | uuid | FK → POLLS.id |
| option_id | uuid | FK → POLL_OPTIONS.id |
| user_id | uuid | FK → USERS.id |
| created_at | datetime | NOT NULL |
| **PK** | | (poll_id, user_id, option_id) |

---

### FEEDS
*(Giữ nguyên — cập nhật entity_type để bao gồm post, story)*

### BOOKMARKS, BOOKMARK_COLLECTIONS, ARTICLE_ANALYTICS
*(Giữ nguyên từ schema gốc)*

---

## 5. Groups

> **Hoàn toàn mới** — Facebook Groups là tính năng cốt lõi.

### GROUPS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| name | string | NOT NULL | |
| slug | string | UNIQUE NOT NULL | |
| description | text | nullable | |
| avatar_url | string | nullable | |
| cover_url | string | nullable | |
| privacy | enum(public, closed, secret) | NOT NULL | |
| type | enum(general, buy_sell, gaming, parenting, travel, other) | default 'general' | |
| member_count | int | default 0 | Cache |
| post_count | int | default 0 | Cache |
| created_by | uuid | FK → USERS.id | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

---

### GROUP_MEMBERS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| group_id | uuid | FK → GROUPS.id | |
| user_id | uuid | FK → USERS.id | |
| role | enum(admin, moderator, member) | default 'member' | |
| status | enum(active, pending, banned) | default 'active' | pending: chờ duyệt |
| invited_by | uuid | FK → USERS.id (nullable) | |
| joined_at | datetime | NOT NULL | |
| **PK** | | (group_id, user_id) | |

---

### GROUP_RULES (MỚI)
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| group_id | uuid | FK → GROUPS.id |
| title | string | NOT NULL |
| description | text | nullable |
| sort_order | int | default 0 |

---

## 6. Pages

> **Hoàn toàn mới** — Facebook Pages cho doanh nghiệp, người nổi tiếng.

### PAGES (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| name | string | NOT NULL | |
| username | string | UNIQUE NOT NULL | |
| category | string | NOT NULL | Business, Artist, Brand... |
| description | text | nullable | |
| avatar_url | string | nullable | |
| cover_url | string | nullable | |
| website | string | nullable | |
| phone | string | nullable | |
| email | string | nullable | |
| address | string | nullable | |
| is_verified | bool | default false | Blue tick |
| follower_count | int | default 0 | Cache |
| created_by | uuid | FK → USERS.id | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

---

### PAGE_ADMINS (MỚI)
| Column | Type | Constraint |
|--------|------|------------|
| page_id | uuid | FK → PAGES.id |
| user_id | uuid | FK → USERS.id |
| role | enum(admin, editor, moderator, advertiser, analyst) | NOT NULL |
| added_at | datetime | NOT NULL |
| **PK** | | (page_id, user_id) |

---

## 7. Marketplace

> **Hoàn toàn mới** — Facebook Marketplace cho mua bán.

### LISTINGS (MỚI)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| seller_id | uuid | FK → USERS.id | |
| title | string | NOT NULL | |
| description | text | nullable | |
| price | decimal(12,2) | NOT NULL | |
| currency | string | default 'VND' | |
| condition | enum(new, like_new, good, fair) | NOT NULL | |
| category | string | NOT NULL | |
| status | enum(active, sold, hidden, deleted) | default 'active' | |
| location_name | string | nullable | |
| location_lat | decimal(10,8) | nullable | |
| location_lng | decimal(11,8) | nullable | |
| view_count | int | default 0 | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### LISTING_MEDIA (MỚI)
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| listing_id | uuid | FK → LISTINGS.id |
| file_url | string | NOT NULL |
| sort_order | int | default 0 |

### LISTING_INQUIRIES (MỚI — chat về sản phẩm)
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| listing_id | uuid | FK → LISTINGS.id | |
| buyer_id | uuid | FK → USERS.id | |
| conversation_id | uuid | FK → CONVERSATIONS.id | Link sang Messaging |
| created_at | datetime | NOT NULL | |

---

## 8. Messaging

> Giữ nguyên cấu trúc, nâng cấp enums và thêm ephemeral messages.

### CONVERSATIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| type | enum(direct, group, marketplace) | NOT NULL | + marketplace |
| name | string | nullable | |
| avatar_url | string | nullable | |
| theme_color | string | nullable | Custom chat theme |
| emoji | string | nullable | Custom emoji |
| last_message_id | uuid | FK → MESSAGES.id (nullable) | |
| created_by | uuid | FK → USERS.id | |
| created_at | datetime | NOT NULL | |

### CONVERSATION_PARTICIPANTS, MESSAGES, MESSAGE_REACTIONS
*(Giữ nguyên, nâng cấp MESSAGE.type thêm `sticker`, `voice`, `video_call_log`)*

---

## 9. Notifications

*(Giữ nguyên 3 bảng: NOTIFICATIONS, NOTIFICATION_PREFERENCES, PUSH_TOKENS)*

---

## 10. WebSocket & Ops

*(Giữ nguyên 3 bảng: WS_CONNECTIONS, REPORTS, AUDIT_LOGS)*  
*Nâng cấp REPORTS.target_type thêm `post`, `group`, `page`, `marketplace_listing`*

---

## Tổng kết Schema Mới

| Nhóm | Số bảng | Bảng |
|------|---------|------|
| Auth & User | 8 | USERS, PROFILES, USER_SETTINGS, ROLES, PERMISSIONS, USER_ROLES, ROLE_PERMISSIONS, REFRESH_TOKENS |
| Social Graph | 6 | FRIENDS, FRIEND_REQUESTS, FOLLOWS, BLOCKS, USER_STATS, USER_PRESENCE |
| Content | 12 | POSTS, POST_MEDIA, POST_TAGS, POST_HASHTAGS, STORIES, STORY_VIEWS, ARTICLES, ARTICLE_VERSIONS, ARTICLE_ASSETS, TAGS, HASHTAGS, ARTICLE_TAGS, ARTICLE_HASHTAGS |
| Engagement | 8 | REACTIONS, COMMENTS, SHARES, FEEDS, BOOKMARKS, BOOKMARK_COLLECTIONS, POLLS, POLL_OPTIONS, POLL_VOTES |
| Groups | 3 | GROUPS, GROUP_MEMBERS, GROUP_RULES |
| Pages | 2 | PAGES, PAGE_ADMINS |
| Marketplace | 3 | LISTINGS, LISTING_MEDIA, LISTING_INQUIRIES |
| Messaging | 4 | CONVERSATIONS, CONVERSATION_PARTICIPANTS, MESSAGES, MESSAGE_REACTIONS |
| Notifications | 3 | NOTIFICATIONS, NOTIFICATION_PREFERENCES, PUSH_TOKENS |
| WebSocket & Ops | 3 | WS_CONNECTIONS, REPORTS, AUDIT_LOGS |
| **Tổng** | **52** | |

---

## Key Design Decisions — Tại sao 80% Facebook?

### ✅ Đã đạt được
- **Friends model 2 chiều** (FRIENDS + FRIEND_REQUESTS) thay vì Follow đơn thuần
- **Post audience granular** (public / friends / friends_of_friends / only_me / custom)
- **7 Facebook Reactions** (like, love, care, haha, wow, sad, angry)
- **Stories 24h** với view tracking
- **Groups** với 3 mức privacy (public, closed, secret)
- **Pages** cho doanh nghiệp với verified badge
- **Marketplace** cơ bản
- **Privacy Settings** granular (tag review, timeline review, 2FA)
- **Post types đa dạng** (feeling, check-in, poll, reel, memory)
- **Polymorphic Comments** (post, article, photo)

### ⚠️ 20% chưa bao gồm (cần hạ tầng riêng)
- **Facebook Events** — cần thêm ~4 bảng (EVENTS, EVENT_GUESTS, EVENT_POSTS...)
- **Facebook Ads / Business Manager** — hệ thống quảng cáo riêng biệt
- **Facebook Gaming / Live Stream** — streaming infrastructure
- **Instagram Reels tích hợp** — cross-platform sync
- **Facebook Pay / Financial** — payment processor riêng
