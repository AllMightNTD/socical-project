import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Poll } from './poll.entity';
import { PollVote } from './poll_vote.entity';

@Entity('poll_options')
export class PollOption extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  poll_id: string;

  @Column({ type: 'varchar', length: 255 })
  option_text: string;

  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // ---- Relations ----

  @ManyToOne(() => Poll, (poll) => poll.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poll_id' })
  poll: Poll;

  @OneToMany(() => PollVote, (pv) => pv.option)
  votes: PollVote[];
}
