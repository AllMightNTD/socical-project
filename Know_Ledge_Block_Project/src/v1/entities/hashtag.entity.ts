import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostHashtag } from './post_hashtag.entity';
import { ArticleHashtag } from './article_hashtag.entity';

@Entity('hashtags')
export class Hashtag extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'float', default: 0.0 })
  trending_score: number;

  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @Column({ type: 'datetime', nullable: true })
  last_used_at: Date;

  // ---- Relations ----

  @OneToMany(() => PostHashtag, (ph) => ph.hashtag)
  post_hashtags: PostHashtag[];

  @OneToMany(() => ArticleHashtag, (ah) => ah.hashtag)
  article_hashtags: ArticleHashtag[];
}
