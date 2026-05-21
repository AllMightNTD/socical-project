import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from '../entities/post.entity';
import { PostMedia } from '../entities/post_media.entity';
import { Friend } from '../entities/friend.entity';
import { Reaction } from '../entities/reaction.entity';
import { Audience, ReactionType, ReactionTargetType } from 'src/constants/enums';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BaseService } from 'src/base/base.service';
import { PostGateway } from './post.gateway';

@Injectable()
export class PostService extends BaseService {
  protected filterableColumns: any = ['id', 'user_id', 'audience'];

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    private readonly dataSource: DataSource,
    private readonly postGateway: PostGateway,
  ) {
    super(postRepository);
  }

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { content, audience, type, feeling, location_name, post_background, media } = createPostDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Post
      const post = queryRunner.manager.create(Post, {
        user_id: userId,
        content,
        audience,
        type: type || (media && media.length > 0 ? (media[0].type === 'video' ? 'video' as any : 'photo' as any) : 'text' as any),
        feeling,
        location_name,
        post_background,
      });

      const savedPost = await queryRunner.manager.save(post);

      // 2. Create Post Media if exists
      if (media && media.length > 0) {
        const postMediaEntities = media.map((m, index) => {
          return queryRunner.manager.create(PostMedia, {
            post_id: savedPost.id,
            file_url: m.file_url,
            type: m.type as any,
            sort_order: m.sort_order ?? index,
          });
        });
        await queryRunner.manager.save(postMediaEntities);
      }

      await queryRunner.commitTransaction();

      // Return complete post with relations
      const completePost = await this.getPostById(savedPost.id);
      
      // Đính kèm reaction stats/user reaction rỗng cho bài viết mới
      const [attachedPost] = await this.attachReactionsToPosts([completePost], userId);

      // Phát sóng realtime bài viết tới các user được phân quyền
      this.broadcastNewPostRealtime(attachedPost);

      return attachedPost;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Failed to create post: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private async broadcastNewPostRealtime(post: any) {
    try {
      const authorId = post.user_id;

      if (post.audience === Audience.PUBLIC) {
        // Gửi cho toàn bộ client đang online
        this.postGateway.broadcastNewPost(post, [], 'public');
      } else if (post.audience === Audience.ONLY_ME) {
        // Chỉ gửi cho tác giả
        this.postGateway.broadcastNewPost(post, [authorId], 'only_me');
      } else if (post.audience === Audience.FRIENDS) {
        // Lấy danh sách bạn bè 2 chiều của tác giả
        const friends = await this.dataSource.manager.find(Friend, {
          where: [
            { user_id: authorId },
            { friend_id: authorId },
          ],
        });

        // Chiết xuất danh sách IDs bạn bè
        const friendIds = friends.map((f) => (f.user_id === authorId ? f.friend_id : f.user_id));
        const recipientUserIds = Array.from(new Set([authorId, ...friendIds]));

        this.postGateway.broadcastNewPost(post, recipientUserIds, 'friends');
      }
    } catch (error) {
      console.error('[PostService] Error during realtime post broadcasting:', error.message);
    }
  }

  async getPostById(id: string): Promise<Post> {
    return this.postRepository.findOne({
      where: { id },
      relations: ['user', 'user.profile', 'media'],
    });
  }

  private async attachReactionsToPosts(posts: Post[], userId: string): Promise<any[]> {
    return Promise.all(
      posts.map(async (post) => {
        // Lấy reaction của user hiện tại
        const userReact = await this.reactionRepository.findOne({
          where: {
            user_id: userId,
            target_id: post.id,
            target_type: ReactionTargetType.POST,
          },
        });

        // Lấy thống kê reactions của post
        const reactStats = await this.reactionRepository.createQueryBuilder('reaction')
          .select('reaction.type', 'type')
          .addSelect('COUNT(reaction.id)', 'count')
          .where('reaction.target_id = :postId AND reaction.target_type = :targetType', {
            postId: post.id,
            targetType: ReactionTargetType.POST,
          })
          .groupBy('reaction.type')
          .getRawMany();

        const stats = reactStats.reduce((acc, current) => {
          acc[current.type] = parseInt(current.count, 10);
          return acc;
        }, {} as Record<string, number>);

        return {
          ...post,
          userReaction: userReact ? userReact.type : null,
          reactionStats: stats,
        };
      }),
    );
  }

  async getFeedPosts(userId: string): Promise<any[]> {
    // 1. Lấy danh sách bạn bè của user hiện tại
    const friendRecords = await this.dataSource.getRepository(Friend).find({
      where: { user_id: userId },
      select: ['friend_id'],
    });
    const friendIds = friendRecords.map((f) => f.friend_id);

    // 2. Query Builder để lọc bài viết bảo mật
    const query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('post.media', 'media')
      .orderBy('post.created_at', 'DESC');

    if (friendIds.length > 0) {
      query.where(
        'post.audience = :public OR post.user_id = :userId OR (post.audience = :friends AND post.user_id IN (:...friendIds))',
        {
          public: Audience.PUBLIC,
          userId,
          friends: Audience.FRIENDS,
          friendIds,
        },
      );
    } else {
      query.where(
        'post.audience = :public OR post.user_id = :userId',
        {
          public: Audience.PUBLIC,
          userId,
        },
      );
    }

    const posts = await query.getMany();
    return this.attachReactionsToPosts(posts, userId);
  }

  async getProfilePosts(targetUserId: string, currentUserId: string): Promise<any[]> {
    // 1. Nếu là chính chủ tự xem trang cá nhân của mình
    if (targetUserId === currentUserId) {
      const posts = await this.postRepository.find({
        where: { user_id: targetUserId },
        order: { created_at: 'DESC' },
        relations: ['user', 'user.profile', 'media'],
      });
      return this.attachReactionsToPosts(posts, currentUserId);
    }

    // 2. Nếu là người khác xem, kiểm tra xem có phải bạn bè không
    const isFriend = await this.dataSource.getRepository(Friend).findOne({
      where: { user_id: currentUserId, friend_id: targetUserId },
    });

    const query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('post.media', 'media')
      .where('post.user_id = :targetUserId', { targetUserId })
      .orderBy('post.created_at', 'DESC');

    if (isFriend) {
      // Nếu là bạn bè: xem được Public và Friends
      query.andWhere('post.audience IN (:...audiences)', {
        audiences: [Audience.PUBLIC, Audience.FRIENDS],
      });
    } else {
      // Nếu là người lạ: chỉ xem được Public
      query.andWhere('post.audience = :public', { public: Audience.PUBLIC });
    }

    const posts = await query.getMany();
    return this.attachReactionsToPosts(posts, currentUserId);
  }

  async toggleReaction(userId: string, postId: string, type: ReactionType) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 1. Tìm reaction hiện tại của user này đối với post này
    const existingReaction = await this.reactionRepository.findOne({
      where: {
        user_id: userId,
        target_id: postId,
        target_type: ReactionTargetType.POST,
      },
    });

    let action: 'created' | 'updated' | 'deleted';
    let userReaction: ReactionType | null = null;

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Cùng loại reaction -> click lại để Xóa reaction (bỏ thích)
        await this.reactionRepository.remove(existingReaction);
        post.reaction_count = Math.max(0, post.reaction_count - 1);
        await this.postRepository.save(post);
        action = 'deleted';
      } else {
        // Khác loại reaction -> Cập nhật loại cảm xúc mới
        existingReaction.type = type;
        await this.reactionRepository.save(existingReaction);
        userReaction = type;
        action = 'updated';
      }
    } else {
      // Chưa từng react -> Tạo mới
      const newReaction = this.reactionRepository.create({
        user_id: userId,
        target_id: postId,
        target_type: ReactionTargetType.POST,
        type,
      });
      await this.reactionRepository.save(newReaction);
      post.reaction_count = post.reaction_count + 1;
      await this.postRepository.save(post);
      userReaction = type;
      action = 'created';
    }

    // 2. Lấy thống kê các loại reaction của post này để gửi về client
    const reactionStats = await this.reactionRepository.createQueryBuilder('reaction')
      .select('reaction.type', 'type')
      .addSelect('COUNT(reaction.id)', 'count')
      .where('reaction.target_id = :postId AND reaction.target_type = :targetType', {
        postId,
        targetType: ReactionTargetType.POST,
      })
      .groupBy('reaction.type')
      .getRawMany();

    // Định dạng lại stats cho frontend dễ dùng: { like: 5, love: 2 }
    const stats = reactionStats.reduce((acc, current) => {
      acc[current.type] = parseInt(current.count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Phát sóng realtime reaction tới các user được phân quyền
    this.broadcastReactionRealtime(post, stats);

    return {
      action,
      userReaction,
      reactionCount: post.reaction_count,
      stats,
    };
  }

  private async broadcastReactionRealtime(post: Post, stats: any) {
    try {
      const authorId = post.user_id;
      const payload = {
        reactionCount: post.reaction_count,
        stats,
      };

      if (post.audience === Audience.PUBLIC) {
        this.postGateway.broadcastPostReaction(post.id, payload, [], 'public');
      } else if (post.audience === Audience.ONLY_ME) {
        this.postGateway.broadcastPostReaction(post.id, payload, [authorId], 'only_me');
      } else if (post.audience === Audience.FRIENDS) {
        const friends = await this.dataSource.manager.find(Friend, {
          where: [
            { user_id: authorId },
            { friend_id: authorId },
          ],
        });

        const friendIds = friends.map((f) => (f.user_id === authorId ? f.friend_id : f.user_id));
        const recipientUserIds = Array.from(new Set([authorId, ...friendIds]));

        this.postGateway.broadcastPostReaction(post.id, payload, recipientUserIds, 'friends');
      }
    } catch (error) {
      console.error('[PostService] Error during realtime reaction broadcasting:', error.message);
    }
  }

  async updatePost(userId: string, postId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user_id !== userId) {
      throw new BadRequestException('You are not authorized to edit this post');
    }

    const { content, audience, type, feeling, location_name, post_background, media } = updatePostDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cập nhật các thông tin cơ bản
      if (content !== undefined) post.content = content;
      if (audience !== undefined) post.audience = audience;
      if (type !== undefined) post.type = type;
      post.feeling = feeling !== undefined ? feeling : post.feeling;
      post.location_name = location_name !== undefined ? location_name : post.location_name;
      post.post_background = post_background !== undefined ? post_background : post.post_background;

      await queryRunner.manager.save(post);

      // 2. Cập nhật hình ảnh/video (nếu được truyền lên)
      if (media !== undefined) {
        // Xóa sạch post media cũ trước
        await queryRunner.manager.delete(PostMedia, { post_id: postId });

        // Tạo và lưu post media mới
        if (media.length > 0) {
          const postMediaEntities = media.map((m, index) => {
            return queryRunner.manager.create(PostMedia, {
              post_id: postId,
              file_url: m.file_url,
              type: m.type as any,
              sort_order: m.sort_order ?? index,
            });
          });
          await queryRunner.manager.save(postMediaEntities);
        }
      }

      await queryRunner.commitTransaction();

      // Return complete post with relations
      const completePost = await this.getPostById(postId);
      
      // Đính kèm reaction stats/user reaction
      const [attachedPost] = await this.attachReactionsToPosts([completePost], userId);

      // Phát sóng realtime bài viết được chỉnh sửa
      this.broadcastPostUpdateRealtime(attachedPost);

      return attachedPost;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Failed to update post: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private async broadcastPostUpdateRealtime(post: any) {
    try {
      const authorId = post.user_id;

      if (post.audience === Audience.PUBLIC) {
        this.postGateway.broadcastPostUpdate(post, [], 'public');
      } else if (post.audience === Audience.ONLY_ME) {
        this.postGateway.broadcastPostUpdate(post, [authorId], 'only_me');
      } else if (post.audience === Audience.FRIENDS) {
        const friends = await this.dataSource.manager.find(Friend, {
          where: [
            { user_id: authorId },
            { friend_id: authorId },
          ],
        });

        const friendIds = friends.map((f) => (f.user_id === authorId ? f.friend_id : f.user_id));
        const recipientUserIds = Array.from(new Set([authorId, ...friendIds]));

        this.postGateway.broadcastPostUpdate(post, recipientUserIds, 'friends');
      }
    } catch (error) {
      console.error('[PostService] Error during realtime post update broadcasting:', error.message);
    }
  }
}
