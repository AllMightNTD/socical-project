import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from './comments.entity';
import { User } from './user.entity';
import { Post } from './posts.entity';

@Entity('reactions')
export class Reaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.reactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, (post) => post.reactions, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.reactions, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column()
  reaction_type: string;

  @CreateDateColumn()
  created_at: Date;
}
