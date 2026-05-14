import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { FriendListType } from 'src/constants/enums';
import { User } from './user.entity';

@Entity('friends')
export class Friend extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  user_id: string;

  @PrimaryColumn({ type: 'varchar' })
  friend_id: string;

  @Column({ type: 'enum', enum: FriendListType, default: FriendListType.NONE })
  list_type: FriendListType;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend_user: User;
}
