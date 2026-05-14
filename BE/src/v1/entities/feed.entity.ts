import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FeedEntityType } from 'src/constants/enums';
import { User } from './user.entity';

@Entity('feeds')
export class Feed extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'varchar' })
  actor_id: string;

  @Column({ type: 'enum', enum: FeedEntityType })
  entity_type: FeedEntityType;

  @Column({ type: 'varchar' })
  entity_id: string;

  @Column({ type: 'float', default: 1.0 })
  score: number;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor: User;
}
