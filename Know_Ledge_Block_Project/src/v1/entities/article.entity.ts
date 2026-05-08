import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ArticleStatus } from 'src/constants/enums';
import { User } from './user.entity';
import { Category } from './category.entity';
import { ArticleVersion } from './article_version.entity';
import { SeoMeta } from './seo_meta.entity';
import { ArticleAsset } from './article_asset.entity';
import { ArticleTag } from './article_tag.entity';
import { ArticleHashtag } from './article_hashtag.entity';

@Entity('articles')
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  author_id: string;

  @Column({ type: 'varchar', nullable: true })
  category_id: string;

  @Column({ type: 'varchar', nullable: true })
  current_version_id: string;

  @Column({ type: 'varchar', nullable: true })
  seo_meta_id: string;

  @Column({ type: 'enum', enum: ArticleStatus })
  status: ArticleStatus;

  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, (user) => user.articles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToOne(() => ArticleVersion, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_version_id' })
  current_version: ArticleVersion;

  @OneToOne(() => SeoMeta, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seo_meta_id' })
  seo_meta: SeoMeta;

  @OneToMany(() => ArticleVersion, (version) => version.article)
  versions: ArticleVersion[];

  @OneToMany(() => ArticleAsset, (asset) => asset.article)
  assets: ArticleAsset[];

  @OneToMany(() => ArticleTag, (at) => at.article)
  tags: ArticleTag[];

  @OneToMany(() => ArticleHashtag, (ah) => ah.article)
  hashtags: ArticleHashtag[];
}
