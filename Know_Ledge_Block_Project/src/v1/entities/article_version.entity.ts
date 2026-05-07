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

@Entity('article_versions')
export class ArticleVersion extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  article_id: string;

  @ManyToOne(() => Article, (a) => a.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  excerpt: string;

  @Column({ default: 'draft' })
  status: string;

  @Column('uuid')
  created_by: string;

  @Column('uuid', { nullable: true })
  reviewed_by: string;

  @Column({ nullable: true })
  review_note: string;

  @CreateDateColumn()
  created_at: Date;
}
