import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShareAudience, ShareToType } from 'src/constants/enums';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('shares')
export class Share extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'varchar' })
  post_id: string;

  @Column({ type: 'enum', enum: ShareToType })
  shared_to_type: ShareToType;

  @Column({ type: 'varchar', nullable: true })
  shared_to_id: string;

  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column({ type: 'enum', enum: ShareAudience, default: ShareAudience.FRIENDS })
  audience: ShareAudience;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
