import {
    BaseEntity,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { Article } from './article.entity';
import { Tag } from './tag.entity';


@Entity('article_tags')
export class ArticleTag extends BaseEntity{
  @PrimaryColumn('uuid')
  article_id: string;

  @PrimaryColumn('uuid')
  tag_id: string;

  @ManyToOne(() => Article, (a) => a.article_tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Tag, (t) => t.article_tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
