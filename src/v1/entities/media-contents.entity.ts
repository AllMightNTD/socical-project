import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './posts.entity';

@Entity('media_contents')
export class MediaContent extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.mediaContents)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column()
  media_url: string;

  @Column()
  media_type: 'image' | 'video';

  @Column({ nullable: true })
  album_id: number;
}
