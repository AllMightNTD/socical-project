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
import { StoryAudience, StoryType } from 'src/constants/enums';
import { User } from './user.entity';
import { Page } from './page.entity';
import { StoryView } from './story_view.entity';

@Entity('stories')
export class Story extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'varchar', nullable: true })
  page_id: string;

  @Column({ type: 'enum', enum: StoryType })
  type: StoryType;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  media_url: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'text', nullable: true })
  text_content: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  background_color: string;

  @Column({ type: 'int', default: 5 })
  duration_seconds: number;

  @Column({ type: 'enum', enum: StoryAudience, default: StoryAudience.FRIENDS })
  audience: StoryAudience;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @CreateDateColumn()
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, (user) => user.stories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @OneToMany(() => StoryView, (sv) => sv.story)
  views: StoryView[];
}
