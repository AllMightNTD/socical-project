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
import { User } from './user.entity';

@Entity('comments')
export class Comment extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  article_id: string;

  @ManyToOne(() => Article, (a) => a.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: true })
  parent_id: string;

  @ManyToOne(() => Comment)
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
