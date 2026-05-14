import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

// Nhập 56/57 entities
import { Permission } from 'src/v1/entities/permission.entity';
import { Profile } from 'src/v1/entities/profile.entity';
import { Role } from 'src/v1/entities/role.entity';
import { RolePermission } from 'src/v1/entities/role_permission.entity';
import { User } from 'src/v1/entities/user.entity';
import { UserPresence } from 'src/v1/entities/user_presence.entity';
import { UserRole } from 'src/v1/entities/user_role.entity';
import { UserSettings } from 'src/v1/entities/user_settings.entity';
import { UserStats } from 'src/v1/entities/user_stats.entity';

import { Post } from 'src/v1/entities/post.entity';
import { PostHashtag } from 'src/v1/entities/post_hashtag.entity';
import { PostMedia } from 'src/v1/entities/post_media.entity';
import { PostTag } from 'src/v1/entities/post_tag.entity';

import { Comment } from 'src/v1/entities/comment.entity';
import { Reaction } from 'src/v1/entities/reaction.entity';
import { Share } from 'src/v1/entities/share.entity';

import { Group } from 'src/v1/entities/group.entity';
import { GroupMember } from 'src/v1/entities/group_member.entity';
import { GroupRule } from 'src/v1/entities/group_rule.entity';

import { Page } from 'src/v1/entities/page.entity';
import { PageAdmin } from 'src/v1/entities/page_admin.entity';

import { Conversation } from 'src/v1/entities/conversation.entity';
import { ConversationParticipant } from 'src/v1/entities/conversation_participant.entity';
import { Message } from 'src/v1/entities/message.entity';
import { MessageReaction } from 'src/v1/entities/message_reaction.entity';

import { Block } from 'src/v1/entities/block.entity';
import { Follow } from 'src/v1/entities/follow.entity';
import { Friend } from 'src/v1/entities/friend.entity';
import { FriendRequest } from 'src/v1/entities/friend_request.entity';

import { Category } from 'src/v1/entities/category.entity';
import { Hashtag } from 'src/v1/entities/hashtag.entity';
import { Tag } from 'src/v1/entities/tag.entity';

import { Article } from 'src/v1/entities/article.entity';
import { ArticleAsset } from 'src/v1/entities/article_asset.entity';
import { ArticleVersion } from 'src/v1/entities/article_version.entity';

import { Story } from 'src/v1/entities/story.entity';
import { StoryView } from 'src/v1/entities/story_view.entity';

import { Poll } from 'src/v1/entities/poll.entity';
import { PollOption } from 'src/v1/entities/poll_option.entity';
import { PollVote } from 'src/v1/entities/poll_vote.entity';

import { Listing } from 'src/v1/entities/listing.entity';
import { ListingInquiry } from 'src/v1/entities/listing_inquiry.entity';
import { ListingMedia } from 'src/v1/entities/listing_media.entity';

import { Bookmark } from 'src/v1/entities/bookmark.entity';
import { BookmarkCollection } from 'src/v1/entities/bookmark_collection.entity';
import { Feed } from 'src/v1/entities/feed.entity';

import { Notification } from 'src/v1/entities/notification.entity';
import { NotificationPreference } from 'src/v1/entities/notification_preference.entity';

import { PushToken } from 'src/v1/entities/push_token.entity';
import { RefreshToken } from 'src/v1/entities/refresh_token.entity';

import { AuditLog } from 'src/v1/entities/audit_log.entity';
import { Report } from 'src/v1/entities/report.entity';
import { SeoMeta } from 'src/v1/entities/seo_meta.entity';

import {
  ArticleStatus,
  Audience,
  BookmarkTargetType,
  CommentTargetType,
  ConversationType,
  FeedEntityType,
  FollowingType,
  FriendRequestStatus,
  GroupMemberRole,
  GroupPrivacy,
  GroupType,
  ListingCondition, ListingStatus,
  MessageType,
  PostMediaType,
  PostType,
  PresenceStatus,
  PushPlatform,
  ReactionTargetType,
  ReactionType,
  ReportTargetType,
  ShareToType,
  StoryAudience,
  StoryType,
  UserStatus
} from 'src/constants/enums';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) { }

  async seedAll() {
    this.logger.log('Starting massive database seed...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');

      // 1. Truncate ALL tables dynamically
      const entities = this.dataSource.entityMetadatas;
      for (const entity of entities) {
        await queryRunner.query(`TRUNCATE TABLE \`${entity.tableName}\``);
      }
      this.logger.log('All tables truncated successfully.');

      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');

      // ==========================================
      // SECTION 1: AUTH & SYSTEM CORE
      // ==========================================

      // Permissions & Roles
      const permRepo = this.dataSource.getRepository(Permission);
      const roleRepo = this.dataSource.getRepository(Role);
      const rolePermRepo = this.dataSource.getRepository(RolePermission);

      const p1 = await permRepo.save({ name: 'MANAGE_USERS', code: 'MANAGE_USERS', module: 'ADMIN', description: 'Quản lý user' });
      const r1 = await roleRepo.save({ name: 'SUPER_ADMIN', description: 'Admin tối cao' });
      const r2 = await roleRepo.save({ name: 'MEMBER', description: 'Người dùng thường' });

      await rolePermRepo.save({ role_id: r1.id, permission_id: p1.id });

      // ==========================================
      // SECTION 2: USERS & PROFILES
      // ==========================================

      const passwordHash = await bcrypt.hash('123456', 10);

      const userRepo = this.dataSource.getRepository(User);
      const profileRepo = this.dataSource.getRepository(Profile);
      const settingsRepo = this.dataSource.getRepository(UserSettings);
      const statsRepo = this.dataSource.getRepository(UserStats);
      const presenceRepo = this.dataSource.getRepository(UserPresence);
      const userRoleRepo = this.dataSource.getRepository(UserRole);

      const friendRepo = this.dataSource.getRepository(Friend);
      const followRepo = this.dataSource.getRepository(Follow);
      const friendReqRepo = this.dataSource.getRepository(FriendRequest);
      const blockRepo = this.dataSource.getRepository(Block);

      // ==========================================
      // SECTION 1: CREATE 100 USERS
      // ==========================================

      const users: User[] = [];

      for (let i = 1; i <= 100; i++) {
        const user = await userRepo.save({
          email: `user${i}@example.com`,
          password: passwordHash,
          username: `user_${i}`,
          first_name: 'Nguyen',
          last_name: `Van ${i}`,
          status: UserStatus.ACTIVE,
        });

        users.push(user);

        await profileRepo.save({
          user_id: user.id,
          full_name: `Nguyen Van ${i}`,
          username: `user_${i}`,
          bio: `Bio of User ${i}`,
          avatar_url: `https://i.pravatar.cc/150?u=${user.id}`,
        });

        await settingsRepo.save({
          user_id: user.id,
          is_private: Math.random() > 0.7,
        });

        await statsRepo.save({
          user_id: user.id,
          follower_count: 0,
        });

        await presenceRepo.save({
          user_id: user.id,
          status:
            Math.random() > 0.5
              ? PresenceStatus.ONLINE
              : PresenceStatus.OFFLINE,
          last_seen_at: new Date(),
        });

        await userRoleRepo.save({
          user_id: user.id,
          role_id: i === 1 ? r1.id : r2.id,
        });
      }

      // ==========================================
      // SECTION 2: RANDOM FRIENDS
      // ==========================================

      const friendData: Partial<Friend>[] = [];
      const friendPairs = new Set<string>();

      while (friendPairs.size < 100) {
        const userA = users[Math.floor(Math.random() * users.length)];
        const userB = users[Math.floor(Math.random() * users.length)];

        if (userA.id === userB.id) {
          continue;
        }

        const pairKey = [userA.id, userB.id].sort().join('-');

        if (friendPairs.has(pairKey)) {
          continue;
        }

        friendPairs.add(pairKey);

        // save 2 chiều
        friendData.push(
          {
            user_id: userA.id,
            friend_id: userB.id,
          },
          {
            user_id: userB.id,
            friend_id: userA.id,
          },
        );
      }

      await friendRepo.save(friendData);

      // ==========================================
      // SECTION 3: RANDOM FOLLOWS
      // ==========================================

      const followData: Partial<Follow>[] = [];
      const followPairs = new Set<string>();

      while (followPairs.size < 100) {
        const follower = users[Math.floor(Math.random() * users.length)];
        const following = users[Math.floor(Math.random() * users.length)];

        if (follower.id === following.id) {
          continue;
        }

        const pairKey = `${follower.id}-${following.id}`;

        if (followPairs.has(pairKey)) {
          continue;
        }

        followPairs.add(pairKey);

        followData.push({
          follower_id: follower.id,
          following_type: FollowingType.USER,
          following_entity_id: following.id,
        });
      }

      await followRepo.save(followData);

      // ==========================================
      // SECTION 4: RANDOM FRIEND REQUESTS
      // ==========================================

      const friendRequestData: Partial<FriendRequest>[] = [];
      const friendRequestPairs = new Set<string>();

      while (friendRequestPairs.size < 100) {
        const sender = users[Math.floor(Math.random() * users.length)];
        const receiver = users[Math.floor(Math.random() * users.length)];

        if (sender.id === receiver.id) {
          continue;
        }

        const pairKey = `${sender.id}-${receiver.id}`;

        if (friendRequestPairs.has(pairKey)) {
          continue;
        }

        friendRequestPairs.add(pairKey);

        friendRequestData.push({
          sender_id: sender.id,
          receiver_id: receiver.id,
          status:
            Math.random() > 0.5
              ? FriendRequestStatus.PENDING
              : FriendRequestStatus.ACCEPTED,
        });
      }

      await friendReqRepo.save(friendRequestData);

      // ==========================================
      // SECTION 5: RANDOM BLOCKS
      // ==========================================

      const blockData: Partial<Block>[] = [];
      const blockPairs = new Set<string>();

      while (blockPairs.size < 30) {
        const blocker = users[Math.floor(Math.random() * users.length)];
        const blocked = users[Math.floor(Math.random() * users.length)];

        if (blocker.id === blocked.id) {
          continue;
        }

        const pairKey = `${blocker.id}-${blocked.id}`;

        if (blockPairs.has(pairKey)) {
          continue;
        }

        blockPairs.add(pairKey);

        blockData.push({
          blocker_id: blocker.id,
          blocked_id: blocked.id,
        });
      }

      await blockRepo.save(blockData);

      console.log('Seed completed successfully');

      // ==========================================
      // SECTION 4: CONTENT (Tags, Categories, Posts, Stories, Articles, Polls)
      // ==========================================

      const tagRepo = this.dataSource.getRepository(Tag);
      const catRepo = this.dataSource.getRepository(Category);
      const hashtagRepo = this.dataSource.getRepository(Hashtag);

      const t1 = await tagRepo.save({ name: 'technology', slug: 'technology' });
      const c1 = await catRepo.save({ name: 'News', slug: 'news' });
      const h1 = await hashtagRepo.save({ name: 'coding' });

      // POSTS
      const postRepo = this.dataSource.getRepository(Post);
      const postMediaRepo = this.dataSource.getRepository(PostMedia);
      const postTagRepo = this.dataSource.getRepository(PostTag);
      const postHashtagRepo = this.dataSource.getRepository(PostHashtag);

      const post1 = await postRepo.save({
        user_id: users[0].id,
        content: `Hello this is a post!`,
        type: PostType.TEXT,
        audience: Audience.PUBLIC,
      });

      await postMediaRepo.save({ post_id: post1.id, file_url: 'https://via.placeholder.com/600', media_type: PostMediaType.IMAGE });
      await postTagRepo.save({ post_id: post1.id, tagged_user_id: users[1].id });
      await postHashtagRepo.save({ post_id: post1.id, hashtag_id: h1.id });

      // POLLS
      const pollRepo = this.dataSource.getRepository(Poll);
      const pollOptRepo = this.dataSource.getRepository(PollOption);
      const pollVoteRepo = this.dataSource.getRepository(PollVote);

      const poll1 = await pollRepo.save({ post_id: post1.id, question: 'Do you like NestJS?', is_multiple_choice: false });
      const opt1 = await pollOptRepo.save({ poll_id: poll1.id, option_text: 'Yes' });
      const opt2 = await pollOptRepo.save({ poll_id: poll1.id, option_text: 'No' });
      await pollVoteRepo.save({ poll_id: poll1.id, option_id: opt1.id, user_id: users[1].id });

      // STORIES
      const storyRepo = this.dataSource.getRepository(Story);
      const storyViewRepo = this.dataSource.getRepository(StoryView);

      const story1 = await storyRepo.save({
        user_id: users[0].id, media_url: 'https://via.placeholder.com/300x500',
        type: StoryType.PHOTO, audience: StoryAudience.PUBLIC, expires_at: new Date(Date.now() + 86400000)
      });
      await storyViewRepo.save({ story_id: story1.id, viewer_id: users[1].id });

      // ARTICLES
      const articleRepo = this.dataSource.getRepository(Article);
      const articleVersionRepo = this.dataSource.getRepository(ArticleVersion);
      const articleAssetRepo = this.dataSource.getRepository(ArticleAsset);

      const article1 = await articleRepo.save({
        author_id: users[0].id, title: 'How to seed DB', slug: 'how-to-seed-db',
        content: 'Long article content...', status: ArticleStatus.PUBLISHED, category_id: c1.id
      });
      await articleVersionRepo.save({ article_id: article1.id, title: 'How to seed DB', content: 'Version 1 content', created_by: users[0].id });
      await articleAssetRepo.save({ article_id: article1.id, file_url: 'https://img.com/a.png' });

      // ==========================================
      // SECTION 5: GROUPS & PAGES
      // ==========================================

      const groupRepo = this.dataSource.getRepository(Group);
      const groupMemRepo = this.dataSource.getRepository(GroupMember);
      const groupRuleRepo = this.dataSource.getRepository(GroupRule);

      const group1 = await groupRepo.save({ name: 'Coder Club', slug: 'coder-club', privacy: GroupPrivacy.PUBLIC, group_type: GroupType.GENERAL, created_by: users[0].id });
      await groupMemRepo.save({ group_id: group1.id, user_id: users[0].id, role: GroupMemberRole.ADMIN });
      await groupRuleRepo.save({ group_id: group1.id, title: 'No Spam', description: 'Do not spam' });

      const pageRepo = this.dataSource.getRepository(Page);
      const pageAdminRepo = this.dataSource.getRepository(PageAdmin);
      const page1 = await pageRepo.save({ name: 'Tech Store', username: 'tech_store', category: 'Tech', created_by: users[1].id });
      await pageAdminRepo.save({ page_id: page1.id, user_id: users[1].id });

      // ==========================================
      // SECTION 6: MARKETPLACE
      // ==========================================

      const listingRepo = this.dataSource.getRepository(Listing);
      const listingMediaRepo = this.dataSource.getRepository(ListingMedia);
      const listingInquiryRepo = this.dataSource.getRepository(ListingInquiry);

      const list1 = await listingRepo.save({
        seller_id: users[2].id, title: 'Macbook Pro', price: 1000,
        category: 'Electronics', condition: ListingCondition.NEW, status: ListingStatus.ACTIVE
      });
      await listingMediaRepo.save({ listing_id: list1.id, file_url: 'https://img.com/mac.png' });
      const localConvRepo = this.dataSource.getRepository(Conversation);
      const listConv = await localConvRepo.save({ type: ConversationType.DIRECT, created_by: users[0].id });
      await listingInquiryRepo.save({ listing_id: list1.id, buyer_id: users[0].id, conversation_id: listConv.id, message: 'Is this available?' });

      // ==========================================
      // SECTION 7: ENGAGEMENTS (Comments, Reactions, Bookmarks)
      // ==========================================

      const commentRepo = this.dataSource.getRepository(Comment);
      const reactionRepo = this.dataSource.getRepository(Reaction);
      const shareRepo = this.dataSource.getRepository(Share);
      const bookmarkRepo = this.dataSource.getRepository(Bookmark);
      const bmColRepo = this.dataSource.getRepository(BookmarkCollection);
      const feedRepo = this.dataSource.getRepository(Feed);

      const cmt1 = await commentRepo.save({ target_type: CommentTargetType.POST, target_id: post1.id, user_id: users[1].id, content: 'Nice!' });
      await reactionRepo.save({ target_id: post1.id, target_type: ReactionTargetType.POST, user_id: users[2].id, type: ReactionType.LIKE });
      await shareRepo.save({ post_id: post1.id, user_id: users[1].id, shared_to_type: ShareToType.TIMELINE });

      const bmCol1 = await bmColRepo.save({ user_id: users[0].id, name: 'My Favorites' });
      await bookmarkRepo.save({ user_id: users[0].id, target_type: BookmarkTargetType.POST, target_id: post1.id, collection_id: bmCol1.id });

      await feedRepo.save({ user_id: users[1].id, actor_id: users[0].id, entity_id: post1.id, entity_type: FeedEntityType.POST, score: 1.0 });

      // ==========================================
      // SECTION 8: MESSAGING & WEBSOCKET
      // ==========================================

      const convRepo = this.dataSource.getRepository(Conversation);
      const cpRepo = this.dataSource.getRepository(ConversationParticipant);
      const msgRepo = this.dataSource.getRepository(Message);
      const msgReaRepo = this.dataSource.getRepository(MessageReaction);

      const conv1 = await convRepo.save({ type: ConversationType.DIRECT, created_by: users[0].id });
      await cpRepo.save({ conversation_id: conv1.id, user_id: users[0].id });
      await cpRepo.save({ conversation_id: conv1.id, user_id: users[1].id });

      const msg1 = await msgRepo.save({
        conversation_id: conv1.id, sender_id: users[0].id, content: 'Hello there', type: MessageType.TEXT
      });
      await msgReaRepo.save({ message_id: msg1.id, user_id: users[1].id, emoji: 'heart' });

      // ==========================================
      // SECTION 9: NOTIFICATIONS & MISC
      // ==========================================

      const notiRepo = this.dataSource.getRepository(Notification);
      const notiPrefRepo = this.dataSource.getRepository(NotificationPreference);
      const pushRepo = this.dataSource.getRepository(PushToken);
      const refreshRepo = this.dataSource.getRepository(RefreshToken);
      const reportRepo = this.dataSource.getRepository(Report);
      const auditRepo = this.dataSource.getRepository(AuditLog);
      const seoRepo = this.dataSource.getRepository(SeoMeta);

      await notiRepo.save({ user_id: users[1].id, actor_id: users[0].id, type: 'NEW_MESSAGE', payload: { message: 'User 1 sent you a message' } });
      await notiPrefRepo.save({ user_id: users[0].id, notification_type: 'NEW_MESSAGE', via_push: true, via_email: true, via_websocket: true });
      await pushRepo.save({ user_id: users[0].id, token: 'FCM-TOKEN-XYZ', platform: PushPlatform.WEB });
      await refreshRepo.save({ user_id: users[0].id, token_hash: 'REFRESH-HASH-123', expires_at: new Date(Date.now() + 86400000) });
      await reportRepo.save({ reporter_id: users[0].id, target_type: ReportTargetType.USER, target_id: users[2].id, reason: 'Spam' });
      await auditRepo.save({ user_id: users[0].id, action: 'LOGIN', entity: 'User', entity_id: users[0].id });
      await seoRepo.save({ meta_title: 'How to seed DB', meta_description: 'A guide on seeding databases' });

      this.logger.log('Database seed for ALL 57 entities completed successfully!');
    } catch (error) {
      this.logger.error('Error seeding database: ', error.stack);
    } finally {
      await queryRunner.release();
    }
  }
}
