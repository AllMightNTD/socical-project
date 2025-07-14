import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.settings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: false })
  is_private: boolean;

  @Column({ default: true })
  notifications_enabled: boolean;
}
