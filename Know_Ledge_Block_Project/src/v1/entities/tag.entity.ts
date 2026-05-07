import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ArticleTag } from './article_tag.entity';

@Entity('tags')
export class Tag extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @OneToMany(() => ArticleTag, (at) => at.tag)
  article_tags: ArticleTag[];
}
