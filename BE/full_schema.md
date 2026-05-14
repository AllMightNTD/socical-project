# Facebook-like Social Platform — Complete Database Schema v2.0

> **52 bảng** | **10 nhóm chức năng** | Kiến trúc ~80% tương tự Facebook

---

## Mục lục

1. [Auth & User](#1-auth--user) — 8 bảng
2. [Social Graph](#2-social-graph) — 6 bảng
3. [Content](#3-content) — 13 bảng
4. [Engagement](#4-engagement) — 9 bảng
5. [Groups](#5-groups) — 3 bảng
6. [Pages](#6-pages) — 2 bảng
7. [Marketplace](#7-marketplace) — 3 bảng
8. [Messaging](#8-messaging) — 4 bảng
9. [Notifications](#9-notifications) — 3 bảng
10. [WebSocket & Ops](#10-websocket--ops) — 3 bảng
11. [Relations tổng hợp](#11-relations-tổng-hợp)

---

## 1. Auth & User

### USERS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| email | string | UNIQUE nullable | Đăng ký bằng email hoặc phone |
| phone | string | UNIQUE nullable | Ít nhất 1 trong 2 phải có |
| password | string | NOT NULL | bcrypt hash |
| status | enum(active, inactive, banned, memorialized) | NOT NULL | memorialized: tài khoản tưởng niệm |
| email_verified_at | datetime | nullable | |
| phone_verified_at | datetime | nullable | |
| last_login_at | datetime | nullable | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |
| deleted_at | datetime | nullable | Soft delete |

---

### PROFILES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | UNIQUE |
| full_name | string | NOT NULL | Tên thật |
| username | string | UNIQUE NOT NULL | @username, dùng trong URL |
| avatar_url | string | nullable | |
| cover_url | string | nullable | Ảnh bìa |
| bio | string | nullable | max 101 ký tự |
| gender | enum(male, female, custom, undisclosed) | nullable | |
| date_of_birth | date | nullable | |
| location_city | string | nullable | |
| location_country | string | nullable | |
| website | string | nullable | |
| relationship_status | enum(single, in_relationship, engaged, married, complicated, separated, divorced, widowed, undisclosed) | nullable | |
| work | json | nullable | [{company, position, start_year, end_year, is_current}] |
| education | json | nullable | [{school, degree, grad_year}] |
| language | string | default 'vi' | |
| timezone | string | default 'Asia/Ho_Chi_Minh' | |
| updated_at | datetime | NOT NULL | |

---

### USER_SETTINGS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | PK FK → USERS.id | |
| post_default_audience | enum(public, friends, friends_of_friends, only_me, custom) | default 'friends' | Audience mặc định khi đăng bài |
| profile_visibility | enum(public, friends, only_me) | default 'friends' | |
| friend_list_visibility | enum(public, friends, only_me) | default 'friends' | |
| following_list_visibility | enum(public, friends, only_me) | default 'friends' | |
| tag_review_enabled | bool | default true | Duyệt trước khi bị tag |
| timeline_review_enabled | bool | default false | Duyệt post người khác đăng lên timeline |
| face_recognition_enabled | bool | default false | |
| two_factor_enabled | bool | default false | |
| two_factor_method | enum(sms, authenticator) | nullable | |
| ad_personalization | bool | default true | |
| data_download_requested_at | datetime | nullable | GDPR |
| updated_at | datetime | NOT NULL | |

---

### ROLES
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | string | UNIQUE NOT NULL |
| description | string | nullable |

---

### PERMISSIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| code | string | UNIQUE NOT NULL |
| description | string | nullable |

---

### USER_ROLES *(pivot)*
| Column | Type | Constraint |
|--------|------|------------|
| user_id | uuid | FK → USERS.id |
| role_id | uuid | FK → ROLES.id |
| **PK** | | (user_id, role_id) |

---

### ROLE_PERMISSIONS *(pivot)*
| Column | Type | Constraint |
|--------|------|------------|
| role_id | uuid | FK → ROLES.id |
| permission_id | uuid | FK → PERMISSIONS.id |
| **PK** | | (role_id, permission_id) |

---

### REFRESH_TOKENS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| token_hash | string | UNIQUE NOT NULL | Rotate sau mỗi lần dùng |
| expires_at | datetime | NOT NULL | |
| revoked_at | datetime | nullable | |
| device_info | string | nullable | |
| ip_address | string | nullable | |
| created_at | datetime | NOT NULL | |

---

## 2. Social Graph

### FRIEND_REQUESTS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| sender_id | uuid | FK → USERS.id | |
| receiver_id | uuid | FK → USERS.id | |
| status | enum(pending, accepted, declined, cancelled) | default 'pending' | |
| message | string | nullable | Lời nhắn khi gửi kết bạn |
| created_at | datetime | NOT NULL | |
| responded_at | datetime | nullable | |
| **UNIQUE** | | (sender_id, receiver_id) | Không gửi 2 lần |
| **CHECK** | | sender_id ≠ receiver_id | |

---

### FRIENDS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | FK → USERS.id | Luôn lưu user_id < friend_id |
| friend_id | uuid | FK → USERS.id | |
| list_type | enum(close_friends, acquaintances, restricted, none) | default 'none' | Friend Lists |
| created_at | datetime | NOT NULL | |
| **PK** | | (user_id, friend_id) | |

> Query: `WHERE user_id = X OR friend_id = X`

---

### FOLLOWS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| follower_id | uuid | FK → USERS.id | |
| following_type | enum(user, page, group) | NOT NULL | Polymorphic |
| following_entity_id | uuid | NOT NULL | ID của user / page / group |
| priority | enum(default, favorites, unfollow) | default 'default' | "See First" / Unfollow |
| status | enum(active, pending) | default 'active' | pending: private account |
| created_at | datetime | NOT NULL | |
| **PK** | | (follower_id, following_type, following_entity_id) | |

---

### BLOCKS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| blocker_id | uuid | FK → USERS.id | |
| blocked_id | uuid | FK → USERS.id | |
| reason | string | nullable | |
| created_at | datetime | NOT NULL | |
| **PK** | | (blocker_id, blocked_id) | |

---

### USER_STATS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | PK FK → USERS.id | |
| friend_count | int | default 0 | |
| follower_count | int | default 0 | Người follow (public figure) |
| following_count | int | default 0 | |
| post_count | int | default 0 | |
| updated_at | datetime | NOT NULL | |

> Cache counter — cập nhật qua trigger hoặc queue, tránh COUNT(*) nặng

---

### USER_PRESENCE
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| user_id | uuid | PK FK → USERS.id | |
| status | enum(online, away, busy, offline) | default 'offline' | |
| custom_status | string | nullable | |
| last_seen_at | datetime | NOT NULL | |
| is_invisible | bool | default false | |

> TTL heartbeat 30s trên Redis, persist vào DB khi disconnect

---

## 3. Content

### POSTS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | Tác giả |
| page_id | uuid | FK → PAGES.id | nullable — đăng bởi Page |
| group_id | uuid | FK → GROUPS.id | nullable — đăng trong Group |
| content | text | nullable | Có thể chỉ có media, không có text |
| type | enum(text, photo, video, link, feeling, check_in, memory, poll, reel) | default 'text' | |
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
| parent_post_id | uuid | FK → POSTS.id | nullable — shared post |
| is_pinned | bool | default false | Pin lên profile/group |
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

### POST_MEDIA
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| post_id | uuid | FK → POSTS.id | |
| file_url | string | NOT NULL | |
| thumbnail_url | string | nullable | Video thumbnail |
| type | enum(image, video, reel, gif) | NOT NULL | |
| width | int | nullable | px |
| height | int | nullable | px |
| duration_seconds | int | nullable | Chỉ dùng cho video |
| alt_text | string | nullable | Accessibility |
| sort_order | int | default 0 | Thứ tự trong album |
| size_bytes | int | nullable | |
| created_at | datetime | NOT NULL | |

---

### POST_TAGS *(pivot — người được tag trong post)*
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| post_id | uuid | FK → POSTS.id | |
| tagged_user_id | uuid | FK → USERS.id | |
| approved_at | datetime | nullable | null = đang chờ duyệt |
| created_at | datetime | NOT NULL | |
| **PK** | | (post_id, tagged_user_id) | |

---

### POST_HASHTAGS *(pivot)*
| Column | Type | Constraint |
|--------|------|------------|
| post_id | uuid | FK → POSTS.id |
| hashtag_id | uuid | FK → HASHTAGS.id |
| **PK** | | (post_id, hashtag_id) |

---

### STORIES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| page_id | uuid | FK → PAGES.id | nullable |
| type | enum(photo, video, text, boomerang) | NOT NULL | |
| media_url | string | nullable | |
| thumbnail_url | string | nullable | |
| text_content | string | nullable | Text story |
| background_color | string | nullable | HEX code |
| duration_seconds | int | default 5 | |
| audience | enum(public, friends, custom) | default 'friends' | |
| expires_at | datetime | NOT NULL | created_at + 24h |
| view_count | int | default 0 | |
| created_at | datetime | NOT NULL | |

---

### STORY_VIEWS
| Column | Type | Constraint |
|--------|------|------------|
| story_id | uuid | FK → STORIES.id |
| viewer_id | uuid | FK → USERS.id |
| viewed_at | datetime | NOT NULL |
| **PK** | | (story_id, viewer_id) |

---

### ARTICLES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| slug | string | UNIQUE NOT NULL | |
| author_id | uuid | FK → USERS.id | |
| category_id | uuid | FK → CATEGORIES.id | nullable |
| current_version_id | uuid | FK → ARTICLE_VERSIONS.id | nullable |
| seo_meta_id | uuid | FK → SEO_META.id | nullable |
| status | enum(draft, review, published, archived) | NOT NULL | |
| published_at | datetime | nullable | |
| view_count | int | default 0 | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |
| deleted_at | datetime | nullable | Soft delete |

---

### ARTICLE_VERSIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| article_id | uuid | FK → ARTICLES.id | |
| title | string | NOT NULL | |
| content | text | NOT NULL | |
| excerpt | text | nullable | |
| status | enum(draft, review, approved, rejected) | NOT NULL | |
| created_by | uuid | FK → USERS.id | |
| reviewed_by | uuid | FK → USERS.id | nullable |
| review_note | string | nullable | |
| created_at | datetime | NOT NULL | |

---

### ARTICLE_ASSETS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| article_id | uuid | FK → ARTICLES.id | |
| file_url | string | NOT NULL | |
| file_type | enum(image, video, document) | NOT NULL | |
| size_bytes | int | nullable | |
| created_at | datetime | NOT NULL | |

---

### CATEGORIES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| name | string | NOT NULL | |
| slug | string | UNIQUE NOT NULL | |
| description | string | nullable | |
| parent_id | uuid | FK → CATEGORIES.id | nullable — self-ref |
| seo_meta_id | uuid | FK → SEO_META.id | nullable |

---

### SEO_META
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| meta_title | string | nullable |
| meta_description | string | nullable |
| meta_keywords | string | nullable |
| og_title | string | nullable |
| og_description | string | nullable |
| og_image | string | nullable |
| canonical_url | string | nullable |

---

### TAGS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | string | UNIQUE NOT NULL |
| slug | string | UNIQUE NOT NULL |

---

### HASHTAGS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| name | string | UNIQUE NOT NULL | |
| trending_score | float | default 0.0 | Time-decay algorithm |
| usage_count | int | default 0 | |
| last_used_at | datetime | nullable | |

---

### ARTICLE_TAGS *(pivot)*
| Column | Type | Constraint |
|--------|------|------------|
| article_id | uuid | FK → ARTICLES.id |
| tag_id | uuid | FK → TAGS.id |
| **PK** | | (article_id, tag_id) |

---

### ARTICLE_HASHTAGS *(pivot)*
| Column | Type | Constraint |
|--------|------|------------|
| article_id | uuid | FK → ARTICLES.id |
| hashtag_id | uuid | FK → HASHTAGS.id |
| **PK** | | (article_id, hashtag_id) |

---

## 4. Engagement

### REACTIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| target_type | enum(post, comment, message, story) | NOT NULL | Polymorphic |
| target_id | uuid | NOT NULL | |
| type | enum(like, love, care, haha, wow, sad, angry) | NOT NULL | Facebook 7 reactions |
| created_at | datetime | NOT NULL | |
| **UNIQUE** | | (user_id, target_type, target_id) | Mỗi user 1 reaction / target |

---

### COMMENTS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| target_type | enum(post, article, photo) | NOT NULL | Polymorphic |
| target_id | uuid | NOT NULL | |
| user_id | uuid | FK → USERS.id | |
| parent_id | uuid | FK → COMMENTS.id | nullable — reply |
| content | text | nullable | Có thể comment bằng sticker/media |
| sticker_url | string | nullable | |
| media_url | string | nullable | Ảnh đính kèm |
| reaction_count | int | default 0 | Cache |
| reply_count | int | default 0 | Cache |
| is_hidden | bool | default false | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |
| deleted_at | datetime | nullable | |

---

### SHARES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | Người share |
| post_id | uuid | FK → POSTS.id | Post gốc |
| shared_to_type | enum(timeline, group, page, message, external) | NOT NULL | |
| shared_to_id | uuid | nullable | Group / Page id |
| caption | text | nullable | |
| audience | enum(public, friends, only_me) | default 'friends' | |
| created_at | datetime | NOT NULL | |

---

### POLLS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| post_id | uuid | FK → POSTS.id | |
| question | string | NOT NULL | |
| allow_multiple | bool | default false | Chọn nhiều đáp án |
| expires_at | datetime | nullable | |
| created_at | datetime | NOT NULL | |

---

### POLL_OPTIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| poll_id | uuid | FK → POLLS.id |
| option_text | string | NOT NULL |
| vote_count | int | default 0 |

---

### POLL_VOTES
| Column | Type | Constraint |
|--------|------|------------|
| poll_id | uuid | FK → POLLS.id |
| option_id | uuid | FK → POLL_OPTIONS.id |
| user_id | uuid | FK → USERS.id |
| created_at | datetime | NOT NULL |
| **PK** | | (poll_id, user_id, option_id) |

---

### FEEDS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | Feed owner |
| actor_id | uuid | FK → USERS.id | Người thực hiện hành động |
| entity_type | enum(post, story, article, follow, reaction, comment, share) | NOT NULL | |
| entity_id | uuid | NOT NULL | |
| score | float | default 1.0 | Ranking weight |
| created_at | datetime | NOT NULL | |

> Fanout-on-write: mỗi follower/friend có 1 row riêng trong FEEDS

---

### BOOKMARKS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| target_type | enum(post, article) | NOT NULL | |
| target_id | uuid | NOT NULL | |
| collection_id | uuid | FK → BOOKMARK_COLLECTIONS.id | nullable |
| created_at | datetime | NOT NULL | |
| **UNIQUE** | | (user_id, target_type, target_id) | |

---

### BOOKMARK_COLLECTIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| name | string | NOT NULL |
| created_at | datetime | NOT NULL |

---

## 5. Groups

### GROUPS
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

### GROUP_MEMBERS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| group_id | uuid | FK → GROUPS.id | |
| user_id | uuid | FK → USERS.id | |
| role | enum(admin, moderator, member) | default 'member' | |
| status | enum(active, pending, banned) | default 'active' | pending: chờ duyệt (closed group) |
| invited_by | uuid | FK → USERS.id | nullable |
| joined_at | datetime | NOT NULL | |
| **PK** | | (group_id, user_id) | |

---

### GROUP_RULES
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| group_id | uuid | FK → GROUPS.id |
| title | string | NOT NULL |
| description | text | nullable |
| sort_order | int | default 0 |

---

## 6. Pages

### PAGES
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
| is_verified | bool | default false | Blue tick ✓ |
| follower_count | int | default 0 | Cache |
| created_by | uuid | FK → USERS.id | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

---

### PAGE_ADMINS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| page_id | uuid | FK → PAGES.id | |
| user_id | uuid | FK → USERS.id | |
| role | enum(admin, editor, moderator, advertiser, analyst) | NOT NULL | |
| added_at | datetime | NOT NULL | |
| **PK** | | (page_id, user_id) | |

---

## 7. Marketplace

### LISTINGS
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

---

### LISTING_MEDIA
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| listing_id | uuid | FK → LISTINGS.id |
| file_url | string | NOT NULL |
| sort_order | int | default 0 |

---

### LISTING_INQUIRIES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| listing_id | uuid | FK → LISTINGS.id | |
| buyer_id | uuid | FK → USERS.id | |
| conversation_id | uuid | FK → CONVERSATIONS.id | Link sang Messaging |
| created_at | datetime | NOT NULL | |

---

## 8. Messaging

### CONVERSATIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| type | enum(direct, group, marketplace) | NOT NULL | +marketplace |
| name | string | nullable | Group only |
| avatar_url | string | nullable | Group only |
| theme_color | string | nullable | Custom chat theme |
| emoji | string | nullable | Custom emoji |
| last_message_id | uuid | FK → MESSAGES.id | nullable |
| created_by | uuid | FK → USERS.id | |
| created_at | datetime | NOT NULL | |

---

### CONVERSATION_PARTICIPANTS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| conversation_id | uuid | FK → CONVERSATIONS.id | |
| user_id | uuid | FK → USERS.id | |
| role | enum(admin, member) | default 'member' | |
| last_read_message_id | uuid | FK → MESSAGES.id | nullable |
| is_muted | bool | default false | |
| joined_at | datetime | NOT NULL | |
| **PK** | | (conversation_id, user_id) | |

---

### MESSAGES
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| conversation_id | uuid | FK → CONVERSATIONS.id | |
| sender_id | uuid | FK → USERS.id | |
| reply_to_id | uuid | FK → MESSAGES.id | nullable — self-ref |
| content | text | nullable | |
| type | enum(text, image, file, sticker, voice, video_call_log, system) | default 'text' | |
| edited_at | datetime | nullable | |
| deleted_at | datetime | nullable | Soft delete |
| created_at | datetime | NOT NULL | |

---

### MESSAGE_REACTIONS
| Column | Type | Constraint |
|--------|------|------------|
| message_id | uuid | FK → MESSAGES.id |
| user_id | uuid | FK → USERS.id |
| emoji | string | NOT NULL |
| created_at | datetime | NOT NULL |
| **PK** | | (message_id, user_id, emoji) |

---

## 9. Notifications

### NOTIFICATIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | Người nhận |
| actor_id | uuid | FK → USERS.id | Người gây ra thông báo |
| type | string | NOT NULL | friend_request, reaction, comment, tag, share... |
| payload | json | NOT NULL | Dữ liệu mở rộng |
| read_at | datetime | nullable | |
| created_at | datetime | NOT NULL | |

---

### NOTIFICATION_PREFERENCES
| Column | Type | Constraint |
|--------|------|------------|
| user_id | uuid | FK → USERS.id |
| notification_type | string | NOT NULL |
| via_push | bool | default true |
| via_email | bool | default true |
| via_websocket | bool | default true |
| quiet_hours_start | time | nullable |
| quiet_hours_end | time | nullable |
| **PK** | | (user_id, notification_type) |

---

### PUSH_TOKENS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| token | string | UNIQUE NOT NULL |
| platform | enum(fcm, apns, web) | NOT NULL |
| is_active | bool | default true |
| last_used_at | datetime | nullable |

---

## 10. WebSocket & Ops

### WS_CONNECTIONS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| user_id | uuid | FK → USERS.id | |
| socket_id | string | UNIQUE NOT NULL | |
| server_id | string | NOT NULL | Multi-node |
| device_type | enum(web, ios, android) | NOT NULL | |
| last_ping_at | datetime | NOT NULL | |
| connected_at | datetime | NOT NULL | |

---

### REPORTS
| Column | Type | Constraint | Ghi chú |
|--------|------|------------|---------|
| id | uuid | PK | |
| reporter_id | uuid | FK → USERS.id | |
| target_type | enum(post, comment, user, group, page, marketplace_listing) | NOT NULL | Polymorphic |
| target_id | uuid | NOT NULL | |
| reason | string | NOT NULL | |
| status | enum(pending, reviewed, dismissed) | default 'pending' | |
| reviewed_by | uuid | FK → USERS.id | nullable |
| created_at | datetime | NOT NULL | |

---

### AUDIT_LOGS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| action | string | NOT NULL |
| entity | string | NOT NULL |
| entity_id | uuid | NOT NULL |
| old_value | json | nullable |
| new_value | json | nullable |
| created_at | datetime | NOT NULL |

---

## 11. Relations tổng hợp

### Auth & User
```
USERS ||--|| PROFILES                     (1 user - 1 profile)
USERS ||--|| USER_SETTINGS                (1 user - 1 settings)
USERS ||--|| USER_STATS                   (1 user - 1 stats)
USERS ||--|| USER_PRESENCE                (1 user - 1 presence)
USERS ||--o{ USER_ROLES                   (1 user - nhiều roles)
ROLES ||--o{ USER_ROLES
ROLES ||--o{ ROLE_PERMISSIONS
PERMISSIONS ||--o{ ROLE_PERMISSIONS
USERS ||--o{ REFRESH_TOKENS               (1 user - nhiều tokens)
```

### Social Graph
```
USERS ||--o{ FRIEND_REQUESTS [as sender]
USERS ||--o{ FRIEND_REQUESTS [as receiver]
USERS ||--o{ FRIENDS [as user_id]
USERS ||--o{ FRIENDS [as friend_id]
USERS ||--o{ FOLLOWS [as follower]
USERS ||--o{ BLOCKS [as blocker]
```

### Content
```
USERS ||--o{ POSTS
PAGES ||--o{ POSTS
GROUPS ||--o{ POSTS
POSTS ||--o{ POST_MEDIA
POSTS ||--o{ POST_TAGS
POSTS ||--o{ POST_HASHTAGS
POSTS ||--o{ POSTS [as parent: shared posts]
USERS ||--o{ STORIES
PAGES ||--o{ STORIES
STORIES ||--o{ STORY_VIEWS
USERS ||--o{ ARTICLES
ARTICLES ||--o{ ARTICLE_VERSIONS
ARTICLES ||--o{ ARTICLE_ASSETS
CATEGORIES ||--o{ CATEGORIES [self-ref]
```

### Engagement
```
USERS ||--o{ REACTIONS
USERS ||--o{ COMMENTS
COMMENTS ||--o{ COMMENTS [self-ref: replies]
USERS ||--o{ SHARES
POSTS ||--o{ POLLS
POLLS ||--o{ POLL_OPTIONS
POLL_OPTIONS ||--o{ POLL_VOTES
USERS ||--o{ FEEDS
USERS ||--o{ BOOKMARKS
USERS ||--o{ BOOKMARK_COLLECTIONS
```

### Groups & Pages
```
USERS ||--o{ GROUPS [as created_by]
GROUPS ||--o{ GROUP_MEMBERS
USERS ||--o{ GROUP_MEMBERS
GROUPS ||--o{ GROUP_RULES
USERS ||--o{ PAGES [as created_by]
PAGES ||--o{ PAGE_ADMINS
USERS ||--o{ PAGE_ADMINS
```

### Marketplace
```
USERS ||--o{ LISTINGS [as seller]
LISTINGS ||--o{ LISTING_MEDIA
LISTINGS ||--o{ LISTING_INQUIRIES
USERS ||--o{ LISTING_INQUIRIES [as buyer]
LISTING_INQUIRIES ||--|| CONVERSATIONS
```

### Messaging
```
USERS ||--o{ CONVERSATIONS [as created_by]
CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS
USERS ||--o{ CONVERSATION_PARTICIPANTS
CONVERSATIONS ||--o{ MESSAGES
USERS ||--o{ MESSAGES [as sender]
MESSAGES ||--o{ MESSAGES [as reply_to]
MESSAGES ||--o{ MESSAGE_REACTIONS
```

### Notifications & Ops
```
USERS ||--o{ NOTIFICATIONS [as user_id]
USERS ||--o{ NOTIFICATIONS [as actor_id]
USERS ||--o{ NOTIFICATION_PREFERENCES
USERS ||--o{ PUSH_TOKENS
USERS ||--o{ WS_CONNECTIONS
USERS ||--o{ REPORTS [as reporter]
USERS ||--o{ AUDIT_LOGS
```

---

## Tổng kết

| Nhóm | Bảng | Danh sách bảng |
|------|------|----------------|
| Auth & User | 8 | USERS, PROFILES, USER_SETTINGS, ROLES, PERMISSIONS, USER_ROLES, ROLE_PERMISSIONS, REFRESH_TOKENS |
| Social Graph | 6 | FRIEND_REQUESTS, FRIENDS, FOLLOWS, BLOCKS, USER_STATS, USER_PRESENCE |
| Content | 13 | POSTS, POST_MEDIA, POST_TAGS, POST_HASHTAGS, STORIES, STORY_VIEWS, ARTICLES, ARTICLE_VERSIONS, ARTICLE_ASSETS, CATEGORIES, SEO_META, TAGS, HASHTAGS, ARTICLE_TAGS, ARTICLE_HASHTAGS |
| Engagement | 9 | REACTIONS, COMMENTS, SHARES, POLLS, POLL_OPTIONS, POLL_VOTES, FEEDS, BOOKMARKS, BOOKMARK_COLLECTIONS |
| Groups | 3 | GROUPS, GROUP_MEMBERS, GROUP_RULES |
| Pages | 2 | PAGES, PAGE_ADMINS |
| Marketplace | 3 | LISTINGS, LISTING_MEDIA, LISTING_INQUIRIES |
| Messaging | 4 | CONVERSATIONS, CONVERSATION_PARTICIPANTS, MESSAGES, MESSAGE_REACTIONS |
| Notifications | 3 | NOTIFICATIONS, NOTIFICATION_PREFERENCES, PUSH_TOKENS |
| WebSocket & Ops | 3 | WS_CONNECTIONS, REPORTS, AUDIT_LOGS |
| **TỔNG** | **54** | |

---

*Facebook-like Social Platform Database Schema v2.0 — Generated for production use*
