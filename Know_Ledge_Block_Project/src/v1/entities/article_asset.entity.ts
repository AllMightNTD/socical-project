import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Article } from './article.entity';

@Entity('article_assets')
export class ArticleAsset extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  article_id: string;

  @ManyToOne(() => Article, (a) => a.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column()
  file_url: string;

  @Column()
  file_type: string;

  @Column()
  size: number;

  @CreateDateColumn()
  created_at: Date;
}
