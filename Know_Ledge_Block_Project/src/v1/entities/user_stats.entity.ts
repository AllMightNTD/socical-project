import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_stats')
export class UserStats extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'int', default: 0 })
  friend_count: number;

  @Column({ type: 'int', default: 0 })
  follower_count: number;

  @Column({ type: 'int', default: 0 })
  following_count: number;

  @Column({ type: 'int', default: 0 })
  post_count: number;

  @UpdateDateColumn()
  updated_at: Date;

  // ---- Relations ----

  @OneToOne(() => User, (user) => user.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
