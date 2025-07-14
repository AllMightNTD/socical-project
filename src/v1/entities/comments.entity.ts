import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './posts.entity';
import { Reaction } from './reactions.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  parent_comment_id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Reaction, (reaction) => reaction.comment)
  reactions: Reaction[];
}
