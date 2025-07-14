import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './posts.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.tags)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column()
  tag_text: string;
}
