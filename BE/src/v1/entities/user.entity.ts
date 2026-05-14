import { UserStatus } from 'src/constants/enums';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Article } from './article.entity';
import { Comment } from './comment.entity';
import { Notification } from './notification.entity';
import { Post } from './post.entity';
import { Profile } from './profile.entity';
import { Reaction } from './reaction.entity';
import { RefreshToken } from './refresh_token.entity';
import { Story } from './story.entity';
import { UserPresence } from './user_presence.entity';
import { UserRole } from './user_role.entity';
import { UserSettings } from './user_settings.entity';
import { UserStats } from './user_stats.entity';
// import { Profile } from './profile.entity';
// import { UserSettings } from './user_settings.entity';
// import { UserRole } from './user_role.entity';
// import { RefreshToken } from './refresh_token.entity';
// import { Post } from './post.entity';
// import { Article } from './article.entity';

// import { Reaction } from './reaction.entity';
// import { Story } from './story.entity';
// import { Notification } from './notification.entity';
// import { UserStats } from './user_stats.entity';
// import { UserPresence } from './user_presence.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  facebook_id: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status: UserStatus;

  @Column({ type: 'datetime', nullable: true })
  email_verified_at: Date;

  @Column({ type: 'datetime', nullable: true })
  phone_verified_at: Date;

  @Column({ type: 'datetime', nullable: true })
  last_login_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // ---- Relations ----

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;

  @OneToOne(() => UserStats, (stats) => stats.user)
  stats: UserStats;

  @OneToOne(() => UserPresence, (presence) => presence.user)
  presence: UserPresence;

  @OneToMany(() => UserRole, (ur) => ur.user)
  user_roles: UserRole[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refresh_tokens: RefreshToken[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions: Reaction[];

  @OneToMany(() => Story, (story) => story.user)
  stories: Story[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => Notification, (n) => n.actor)
  acted_notifications: Notification[];
}
