import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Story } from './story.entity';
import { User } from './user.entity';

@Entity('story_views')
export class StoryView extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  story_id: string;

  @PrimaryColumn({ type: 'varchar' })
  viewer_id: string;

  @CreateDateColumn()
  viewed_at: Date;

  // ---- Relations ----

  @ManyToOne(() => Story, (story) => story.views, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewer_id' })
  viewer: User;
}
