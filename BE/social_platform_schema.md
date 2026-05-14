# Social Platform — Full Database Schema

> **33 bảng** | 7 nhóm chức năng | WebSocket nâng cao

---

## Mục lục

1. [Auth & User](#1-auth--user)
2. [Social Graph](#2-social-graph)
3. [Content](#3-content)
4. [Engagement](#4-engagement)
5. [Messaging](#5-messaging)
6. [Notifications](#6-notifications)
7. [WebSocket & Ops](#7-websocket--ops)
8. [Relations tổng hợp](#8-relations-tổng-hợp)

---

## 1. Auth & User

### USERS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| email | string | UNIQUE NOT NULL |
| password | string | NOT NULL |
| status | enum(active, inactive, banned) | NOT NULL |
| email_verified_at | datetime | nullable |
| last_login_at | datetime | nullable |
| created_at | datetime | NOT NULL |
| updated_at | datetime | NOT NULL |
| deleted_at | datetime | nullable (soft delete) |

---

### PROFILES
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| full_name | string | nullable |
| avatar_url | string | nullable |
| bio | string | nullable |
| language | string | default 'vi' |
| timezone | string | default 'Asia/Ho_Chi_Minh' |

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
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| token_hash | string | UNIQUE NOT NULL |
| expires_at | datetime | NOT NULL |
| revoked_at | datetime | nullable |
| device_info | string | nullable |
| ip_address | string | nullable |

---

## 2. Social Graph

### FOLLOWS
| Column | Type | Constraint |
|--------|------|------------|
| follower_id | uuid | FK → USERS.id |
| following_id | uuid | FK → USERS.id |
| status | enum(pending, active) | default 'active' |
| created_at | datetime | NOT NULL |
| **PK** | | (follower_id, following_id) |

> `follower_id ≠ following_id` — không tự follow mình

---

### BLOCKS
| Column | Type | Constraint |
|--------|------|------------|
| blocker_id | uuid | FK → USERS.id |
| blocked_id | uuid | FK → USERS.id |
| reason | string | nullable |
| created_at | datetime | NOT NULL |
| **PK** | | (blocker_id, blocked_id) |

---

### USER_STATS
| Column | Type | Constraint |
|--------|------|------------|
| user_id | uuid | PK FK → USERS.id |
| follower_count | int | default 0 |
| following_count | int | default 0 |
| article_count | int | default 0 |
| updated_at | datetime | NOT NULL |

> Cache counter — cập nhật qua trigger hoặc queue, tránh COUNT(*) nặng

---

### USER_PRESENCE
| Column | Type | Constraint |
|--------|------|------------|
| user_id | uuid | PK FK → USERS.id |
| status | enum(online, away, busy, offline) | default 'offline' |
| custom_status | string | nullable |
| last_seen_at | datetime | NOT NULL |
| is_invisible | bool | default false |

> TTL heartbeat 30s trên Redis, persist vào DB khi disconnect

---

## 3. Content

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

### CATEGORIES
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | string | NOT NULL |
| slug | string | UNIQUE NOT NULL |
| description | string | nullable |
| parent_id | uuid | FK → CATEGORIES.id (self-ref, nullable) |
| seo_meta_id | uuid | FK → SEO_META.id (nullable) |

---

### TAGS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | string | UNIQUE NOT NULL |
| slug | string | UNIQUE NOT NULL |

---

### HASHTAGS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | string | UNIQUE NOT NULL |
| trending_score | float | default 0.0 (time-decay algorithm) |
| usage_count | int | default 0 |
| last_used_at | datetime | nullable |

---

### ARTICLES
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| slug | string | UNIQUE NOT NULL |
| author_id | uuid | FK → USERS.id |
| category_id | uuid | FK → CATEGORIES.id (nullable) |
| current_version_id | uuid | FK → ARTICLE_VERSIONS.id (nullable) |
| seo_meta_id | uuid | FK → SEO_META.id (nullable) |
| status | enum(draft, review, published, archived) | NOT NULL |
| published_at | datetime | nullable |
| view_count | int | default 0 |
| created_at | datetime | NOT NULL |
| updated_at | datetime | NOT NULL |
| deleted_at | datetime | nullable (soft delete) |

---

### ARTICLE_VERSIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| article_id | uuid | FK → ARTICLES.id |
| title | string | NOT NULL |
| content | text | NOT NULL |
| excerpt | text | nullable |
| status | enum(draft, review, approved, rejected) | NOT NULL |
| created_by | uuid | FK → USERS.id |
| reviewed_by | uuid | FK → USERS.id (nullable) |
| review_note | string | nullable |
| created_at | datetime | NOT NULL |

---

### ARTICLE_ASSETS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| article_id | uuid | FK → ARTICLES.id |
| file_url | string | NOT NULL |
| file_type | enum(image, video, document) | NOT NULL |
| size | int | bytes |
| created_at | datetime | NOT NULL |

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

### COMMENTS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| article_id | uuid | FK → ARTICLES.id |
| user_id | uuid | FK → USERS.id |
| parent_id | uuid | FK → COMMENTS.id (self-ref, nullable) |
| content | text | NOT NULL |
| created_at | datetime | NOT NULL |

---

### REACTIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| target_type | enum(article, comment) | NOT NULL |
| target_id | uuid | NOT NULL (polymorphic) |
| type | enum(like, love, clap, insightful) | NOT NULL |
| **UNIQUE** | | (user_id, target_type, target_id, type) |

---

### FEEDS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id (feed owner) |
| actor_id | uuid | FK → USERS.id (người thực hiện) |
| entity_type | enum(article, follow, reaction, comment) | NOT NULL |
| entity_id | uuid | NOT NULL |
| score | float | default 1.0 (ranking weight) |
| created_at | datetime | NOT NULL |

> Fanout-on-write: mỗi follower có 1 row riêng trong FEEDS

---

### BOOKMARKS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| article_id | uuid | FK → ARTICLES.id |
| collection_id | uuid | FK → BOOKMARK_COLLECTIONS.id (nullable) |
| created_at | datetime | NOT NULL |
| **UNIQUE** | | (user_id, article_id) |

---

### BOOKMARK_COLLECTIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| name | string | NOT NULL |
| created_at | datetime | NOT NULL |

---

### ARTICLE_ANALYTICS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| article_id | uuid | FK → ARTICLES.id |
| user_id | uuid | FK → USERS.id (nullable, anonymous) |
| session_id | string | NOT NULL |
| read_time_seconds | int | default 0 |
| scroll_depth_pct | int | 0–100 |
| referrer | string | nullable |
| created_at | datetime | NOT NULL |

---

## 5. Messaging

### CONVERSATIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| type | enum(direct, group) | NOT NULL |
| name | string | nullable (group only) |
| avatar_url | string | nullable (group only) |
| last_message_id | uuid | FK → MESSAGES.id (nullable) |
| created_by | uuid | FK → USERS.id |
| created_at | datetime | NOT NULL |

---

### CONVERSATION_PARTICIPANTS
| Column | Type | Constraint |
|--------|------|------------|
| conversation_id | uuid | FK → CONVERSATIONS.id |
| user_id | uuid | FK → USERS.id |
| role | enum(admin, member) | default 'member' |
| last_read_message_id | uuid | FK → MESSAGES.id (nullable) |
| is_muted | bool | default false |
| joined_at | datetime | NOT NULL |
| **PK** | | (conversation_id, user_id) |

---

### MESSAGES
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| conversation_id | uuid | FK → CONVERSATIONS.id |
| sender_id | uuid | FK → USERS.id |
| reply_to_id | uuid | FK → MESSAGES.id (self-ref, nullable) |
| content | text | NOT NULL |
| type | enum(text, image, file, system) | default 'text' |
| edited_at | datetime | nullable |
| deleted_at | datetime | nullable (soft delete) |
| created_at | datetime | NOT NULL |

---

### MESSAGE_REACTIONS
| Column | Type | Constraint |
|--------|------|------------|
| message_id | uuid | FK → MESSAGES.id |
| user_id | uuid | FK → USERS.id |
| emoji | string | NOT NULL (e.g. 👍, ❤️) |
| created_at | datetime | NOT NULL |
| **PK** | | (message_id, user_id, emoji) |

---

## 6. Notifications

### NOTIFICATIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| type | string | NOT NULL |
| payload | json | NOT NULL |
| read_at | datetime | nullable |
| created_at | datetime | NOT NULL |

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

## 7. WebSocket & Ops

### WS_CONNECTIONS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → USERS.id |
| socket_id | string | UNIQUE NOT NULL |
| server_id | string | NOT NULL (multi-node) |
| device_type | enum(web, ios, android) | NOT NULL |
| last_ping_at | datetime | NOT NULL |
| connected_at | datetime | NOT NULL |

---

### REPORTS
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| reporter_id | uuid | FK → USERS.id |
| target_type | enum(article, comment, user) | NOT NULL |
| target_id | uuid | NOT NULL (polymorphic) |
| reason | string | NOT NULL |
| status | enum(pending, reviewed, dismissed) | default 'pending' |
| reviewed_by | uuid | FK → USERS.id (nullable) |
| created_at | datetime | NOT NULL |

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

## 8. Relations tổng hợp

### Auth & User

```
USERS ||--|| PROFILES            (1 user có đúng 1 profile)
USERS ||--|| USER_STATS          (1 user có đúng 1 bộ stats)
USERS ||--|| USER_PRESENCE       (1 user có đúng 1 presence)
USERS ||--o{ USER_ROLES          (1 user có nhiều roles)
ROLES ||--o{ USER_ROLES          (1 role gán cho nhiều users)
ROLES ||--o{ ROLE_PERMISSIONS    (1 role có nhiều permissions)
PERMISSIONS ||--o{ ROLE_PERMISSIONS (1 permission thuộc nhiều roles)
USERS ||--o{ REFRESH_TOKENS      (1 user có nhiều refresh tokens)
```

### Social Graph

```
USERS ||--o{ FOLLOWS [as follower]   (1 user follow nhiều người)
USERS ||--o{ FOLLOWS [as following]  (1 user được nhiều người follow)
USERS ||--o{ BLOCKS [as blocker]     (1 user block nhiều người)
USERS ||--o{ BLOCKS [as blocked]     (1 user bị nhiều người block)
```

### Content

```
USERS ||--o{ ARTICLES                (1 user viết nhiều articles)
CATEGORIES ||--o{ ARTICLES           (1 category chứa nhiều articles)
CATEGORIES ||--o{ CATEGORIES         (self-ref: 1 category có nhiều sub-categories)
SEO_META ||--o{ ARTICLES             (1 seo_meta dùng cho nhiều articles)
SEO_META ||--o{ CATEGORIES           (1 seo_meta dùng cho nhiều categories)
ARTICLES ||--o{ ARTICLE_VERSIONS     (1 article có nhiều phiên bản)
USERS ||--o{ ARTICLE_VERSIONS [as created_by]  (1 user tạo nhiều versions)
USERS ||--o{ ARTICLE_VERSIONS [as reviewed_by] (1 user review nhiều versions)
ARTICLES ||--o{ ARTICLE_ASSETS       (1 article có nhiều assets)
ARTICLES ||--o{ ARTICLE_TAGS         (1 article gán nhiều tags)
TAGS ||--o{ ARTICLE_TAGS             (1 tag gán cho nhiều articles)
ARTICLES ||--o{ ARTICLE_HASHTAGS     (1 article có nhiều hashtags)
HASHTAGS ||--o{ ARTICLE_HASHTAGS     (1 hashtag dùng trong nhiều articles)
```

### Engagement

```
ARTICLES ||--o{ COMMENTS             (1 article có nhiều comments)
USERS ||--o{ COMMENTS                (1 user viết nhiều comments)
COMMENTS ||--o{ COMMENTS             (self-ref: 1 comment có nhiều replies)
USERS ||--o{ REACTIONS               (1 user react nhiều lần)
USERS ||--o{ FEEDS                   (1 user có feed riêng)
USERS ||--o{ BOOKMARKS               (1 user bookmark nhiều articles)
ARTICLES ||--o{ BOOKMARKS            (1 article được nhiều user bookmark)
USERS ||--o{ BOOKMARK_COLLECTIONS    (1 user tạo nhiều collections)
BOOKMARK_COLLECTIONS ||--o{ BOOKMARKS (1 collection chứa nhiều bookmarks)
ARTICLES ||--o{ ARTICLE_ANALYTICS    (1 article có nhiều analytics events)
```

### Messaging

```
USERS ||--o{ CONVERSATIONS [as created_by]          (1 user tạo nhiều conversations)
CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS       (1 conversation có nhiều participants)
USERS ||--o{ CONVERSATION_PARTICIPANTS               (1 user tham gia nhiều conversations)
CONVERSATIONS ||--o{ MESSAGES                        (1 conversation chứa nhiều messages)
USERS ||--o{ MESSAGES [as sender]                    (1 user gửi nhiều messages)
MESSAGES ||--o{ MESSAGES [as reply_to]               (self-ref: 1 message có nhiều replies)
MESSAGES ||--o{ MESSAGE_REACTIONS                    (1 message có nhiều reactions)
USERS ||--o{ MESSAGE_REACTIONS                       (1 user react nhiều messages)
```

### Notifications

```
USERS ||--o{ NOTIFICATIONS                  (1 user nhận nhiều notifications)
USERS ||--o{ NOTIFICATION_PREFERENCES       (1 user có nhiều preference settings)
USERS ||--o{ PUSH_TOKENS                    (1 user đăng ký nhiều devices)
```

### WebSocket & Ops

```
USERS ||--o{ WS_CONNECTIONS         (1 user có nhiều socket connections đồng thời)
USERS ||--o{ REPORTS [as reporter]  (1 user gửi nhiều reports)
USERS ||--o{ REPORTS [as reviewed_by] (1 moderator review nhiều reports)
USERS ||--o{ AUDIT_LOGS             (1 user sinh ra nhiều audit logs)
```

---

## Tổng kết

| Nhóm | Số bảng | Bảng |
|------|---------|------|
| Auth & User | 7 | USERS, PROFILES, ROLES, PERMISSIONS, USER_ROLES, ROLE_PERMISSIONS, REFRESH_TOKENS |
| Social Graph | 4 | FOLLOWS, BLOCKS, USER_STATS, USER_PRESENCE |
| Content | 9 | ARTICLES, ARTICLE_VERSIONS, ARTICLE_ASSETS, CATEGORIES, SEO_META, TAGS, HASHTAGS, ARTICLE_TAGS, ARTICLE_HASHTAGS |
| Engagement | 6 | COMMENTS, REACTIONS, FEEDS, BOOKMARKS, BOOKMARK_COLLECTIONS, ARTICLE_ANALYTICS |
| Messaging | 4 | CONVERSATIONS, CONVERSATION_PARTICIPANTS, MESSAGES, MESSAGE_REACTIONS |
| Notifications | 3 | NOTIFICATIONS, NOTIFICATION_PREFERENCES, PUSH_TOKENS |
| WebSocket & Ops | 3 | WS_CONNECTIONS, REPORTS, AUDIT_LOGS |
| **Tổng** | **33** | |

---

*Generated for Social Platform with Advanced WebSocket Support*
