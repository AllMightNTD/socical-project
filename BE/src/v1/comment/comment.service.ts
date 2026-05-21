import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Friend } from '../entities/friend.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentGateway } from './comment.gateway';
import { CommentTargetType, Audience } from 'src/constants/enums';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly commentGateway: CommentGateway,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Helper để lấy danh sách user_id được xem bài viết để phát socket realtime
   */
  private async getRecipientUserIds(post: Post): Promise<{ recipientIds: string[]; audience: string }> {
    const authorId = post.user_id;

    if (post.audience === Audience.PUBLIC) {
      return { recipientIds: [], audience: 'public' };
    } else if (post.audience === Audience.ONLY_ME) {
      return { recipientIds: [authorId], audience: 'only_me' };
    } else if (post.audience === Audience.FRIENDS) {
      const friends = await this.dataSource.manager.find(Friend, {
        where: [
          { user_id: authorId },
          { friend_id: authorId },
        ],
      });

      const friendIds = friends.map((f) => (f.user_id === authorId ? f.friend_id : f.user_id));
      const recipientIds = Array.from(new Set([authorId, ...friendIds]));
      return { recipientIds, audience: 'friends' };
    }

    return { recipientIds: [], audience: 'public' };
  }

  /**
   * Lấy danh sách comment gốc (parent_id IS NULL)
   */
  async getComments(
    targetType: CommentTargetType,
    targetId: string,
    query: { page?: number; limit?: number; sort?: 'newest' | 'oldest' },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const sort = query.sort || 'oldest'; // Hiển thị từ cũ tới mới để dễ đọc luồng chat
    const skip = (page - 1) * limit;

    // Kiểm tra target
    if (targetType === CommentTargetType.POST) {
      const post = await this.postRepository.findOne({ where: { id: targetId } });
      if (!post) throw new NotFoundException('Post not found');
    }

    // Lấy các comment gốc
    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        target_type: targetType,
        target_id: targetId,
        parent_id: IsNull(),
        is_hidden: false,
      },
      relations: ['user', 'user.profile'],
      order: {
        created_at: sort === 'newest' ? 'DESC' : 'ASC',
      },
      skip,
      take: limit,
    });

    // Với mỗi comment gốc, tải trước 3 reply đầu tiên (cấp 2) để hiển thị nhanh ở client
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const [replies, replyCount] = await this.commentRepository.findAndCount({
          where: {
            parent_id: comment.id,
            is_hidden: false,
          },
          relations: ['user', 'user.profile'],
          order: {
            created_at: 'ASC', // Phản hồi luôn xếp từ cũ tới mới
          },
          take: 3,
        });

        return {
          ...comment,
          replies,
          reply_count: replyCount,
        };
      }),
    );

    return {
      comments: commentsWithReplies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy danh sách reply của một comment cha cụ thể (khi click "Tải thêm")
   */
  async getReplies(
    commentId: string,
    query: { page?: number; limit?: number },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const parentComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const [replies, total] = await this.commentRepository.findAndCount({
      where: {
        parent_id: commentId,
        is_hidden: false,
      },
      relations: ['user', 'user.profile'],
      order: {
        created_at: 'ASC',
      },
      skip,
      take: limit,
    });

    return {
      replies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tạo bình luận mới (Hoặc reply comment)
   */
  async createComment(userId: string, dto: CreateCommentDto) {
    const { target_type, target_id, parent_id, content, media_url, sticker_url } = dto;

    if (!content?.trim() && !media_url && !sticker_url) {
      throw new BadRequestException('Comment must contain text, media, or a sticker');
    }

    // 1. Kiểm tra đối tượng được comment
    let post: Post | null = null;
    if (target_type === CommentTargetType.POST) {
      post = await this.postRepository.findOne({ where: { id: target_id } });
      if (!post) throw new NotFoundException('Post not found');
    } else {
      throw new BadRequestException('Unsupported target type');
    }

    // 2. Nếu có parent_id, kiểm tra comment cha tồn tại
    let parentComment: Comment | null = null;
    if (parent_id) {
      parentComment = await this.commentRepository.findOne({ where: { id: parent_id } });
      if (!parentComment) throw new NotFoundException('Parent comment not found');
      if (parentComment.parent_id) {
        // Giới hạn cứng tối đa 2 level nested: 
        // Nếu comment cha đã có parent_id (tức comment cha là level 2), 
        // thì reply mới sẽ được đưa về cùng cấp level 2 (chung parent_id là comment cha gốc).
        dto.parent_id = parentComment.parent_id;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Khởi tạo comment mới
      const newComment = queryRunner.manager.create(Comment, {
        target_type,
        target_id,
        parent_id: dto.parent_id || null,
        user_id: userId,
        content: content?.trim(),
        media_url,
        sticker_url,
      });

      const savedComment = await queryRunner.manager.save(Comment, newComment);

      // 4. Cập nhật số lượng đếm tương ứng
      if (dto.parent_id) {
        // Tăng reply_count của comment cha gốc
        await queryRunner.manager.increment(Comment, { id: dto.parent_id }, 'reply_count', 1);
      }

      if (target_type === CommentTargetType.POST && post) {
        // Tăng comment_count của Post gốc
        await queryRunner.manager.increment(Post, { id: target_id }, 'comment_count', 1);
      }

      await queryRunner.commitTransaction();

      // 5. Populate profile tác giả để gửi client
      const fullComment = await this.commentRepository.findOne({
        where: { id: savedComment.id },
        relations: ['user', 'user.profile'],
      });

      // 6. Broadcast Realtime qua socket.io
      if (post) {
        const { recipientIds, audience } = await this.getRecipientUserIds(post);
        const payload = {
          ...fullComment,
          postId: target_id,
          parentId: dto.parent_id || null,
        };
        this.commentGateway.broadcastCommentCreated(payload, recipientIds, audience);
      }

      return fullComment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Chỉnh sửa comment chính chủ
   */
  async updateComment(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You are not authorized to edit this comment');
    }

    const { content, media_url, sticker_url } = dto;
    if (!content?.trim() && !media_url && !sticker_url) {
      throw new BadRequestException('Comment cannot be empty');
    }

    comment.content = content?.trim() || null;
    comment.media_url = media_url || null;
    comment.sticker_url = sticker_url || null;

    const saved = await this.commentRepository.save(comment);

    const fullComment = await this.commentRepository.findOne({
      where: { id: saved.id },
      relations: ['user', 'user.profile'],
    });

    // Broadcast update realtime
    if (comment.target_type === CommentTargetType.POST) {
      const post = await this.postRepository.findOne({ where: { id: comment.target_id } });
      if (post) {
        const { recipientIds, audience } = await this.getRecipientUserIds(post);
        const payload = {
          ...fullComment,
          postId: comment.target_id,
          parentId: comment.parent_id || null,
        };
        this.commentGateway.broadcastCommentUpdated(payload, recipientIds, audience);
      }
    }

    return fullComment;
  }

  /**
   * Xóa comment (chính chủ comment hoặc chính chủ bài viết)
   */
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Lấy thông tin post gốc để check xem có phải chủ bài viết không
    let isPostAuthor = false;
    let post: Post | null = null;
    if (comment.target_type === CommentTargetType.POST) {
      post = await this.postRepository.findOne({ where: { id: comment.target_id } });
      if (post && post.user_id === userId) {
        isPostAuthor = true;
      }
    }

    // Chỉ chính chủ comment hoặc chủ bài viết mới được xóa
    if (comment.user_id !== userId && !isPostAuthor) {
      throw new ForbiddenException('You are not authorized to delete this comment');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Giảm reply_count của comment cha nếu đây là reply
      if (comment.parent_id) {
        await queryRunner.manager.decrement(Comment, { id: comment.parent_id }, 'reply_count', 1);
      } else {
        // Nếu xóa comment gốc, giảm comment_count của Post gốc theo tổng số comment gốc + các reply con của nó
        const childRepliesCount = await this.commentRepository.count({
          where: { parent_id: comment.id },
        });

        if (comment.target_type === CommentTargetType.POST && post) {
          const totalToDecrement = childRepliesCount + 1;
          await queryRunner.manager.decrement(Post, { id: comment.target_id }, 'comment_count', totalToDecrement);
        }

        // Tự động xóa hoặc ẩn toàn bộ reply con
        await queryRunner.manager.delete(Comment, { parent_id: comment.id });
      }

      if (!comment.parent_id && comment.target_type === CommentTargetType.POST && post && comment.parent_id === null) {
        // Chỉ giảm 1 nếu chỉ xóa comment con
      } else if (comment.parent_id && comment.target_type === CommentTargetType.POST && post) {
        await queryRunner.manager.decrement(Post, { id: comment.target_id }, 'comment_count', 1);
      }

      // 2. Thực hiện xóa comment khỏi DB
      await queryRunner.manager.delete(Comment, { id: commentId });

      await queryRunner.commitTransaction();

      // 3. Broadcast sự kiện xóa realtime
      if (post) {
        const { recipientIds, audience } = await this.getRecipientUserIds(post);
        const payload = {
          commentId,
          parentId: comment.parent_id || undefined,
          postId: comment.target_id,
        };
        this.commentGateway.broadcastCommentDeleted(payload, recipientIds, audience);
      }

      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
