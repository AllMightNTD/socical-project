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
import { ArticleAsset } from './article_asset.entity';
import { ArticleTag } from './article_tag.entity';
import { ArticleVersion } from './article_version.entity';
import { Category } from './categorires.entity';
import { Comment } from './comment.entity';
import { SeoMeta } from './seo_meta.entity';
import { User } from './user.entity';

@Entity('articles')
export class Article extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column('uuid')
  author_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column('uuid')
  category_id: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column('uuid', { nullable: true })
  current_version_id: string;

  @OneToOne(() => ArticleVersion)
  @JoinColumn({ name: 'current_version_id' })
  current_version: ArticleVersion;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @Column({ default: 0 })
  view_count: number;

  @Column('uuid', { nullable: true })
  seo_meta_id: string;

  @ManyToOne(() => SeoMeta)
  @JoinColumn({ name: 'seo_meta_id' })
  seo_meta: SeoMeta;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @OneToMany(() => ArticleVersion, (v) => v.article)
  versions: ArticleVersion[];

  @OneToMany(() => ArticleAsset, (a) => a.article)
  assets: ArticleAsset[];

  @OneToMany(() => Comment, (c) => c.article)
  comments: Comment[];

  @OneToMany(() => ArticleTag, (at) => at.article)
  article_tags: ArticleTag[];
}
