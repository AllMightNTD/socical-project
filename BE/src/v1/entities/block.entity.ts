import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('blocks')
export class Block extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  blocker_id: string;

  @PrimaryColumn({ type: 'varchar' })
  blocked_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;
}
