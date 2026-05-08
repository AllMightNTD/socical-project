import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostMediaType } from 'src/constants/enums';
import { Post } from './post.entity';

@Entity('post_media')
export class PostMedia extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  post_id: string;

  @Column({ type: 'varchar', length: 1000 })
  file_url: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'enum', enum: PostMediaType })
  type: PostMediaType;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  alt_text: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'int', nullable: true })
  size_bytes: number;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => Post, (post) => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
