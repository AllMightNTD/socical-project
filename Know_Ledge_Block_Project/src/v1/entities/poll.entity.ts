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
import { Post } from './post.entity';
import { PollOption } from './poll_option.entity';
import { PollVote } from './poll_vote.entity';

@Entity('polls')
export class Poll extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  post_id: string;

  @Column({ type: 'varchar', length: 500 })
  question: string;

  @Column({ type: 'boolean', default: false })
  allow_multiple: boolean;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => Post, (post) => post.polls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @OneToMany(() => PollOption, (po) => po.poll)
  options: PollOption[];

  @OneToMany(() => PollVote, (pv) => pv.poll)
  votes: PollVote[];
}
