import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { SeoMeta } from './seo_meta.entity';

@Entity('categories')
export class Category extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @ManyToOne(() => Category, (c) => c.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[];

  @Column({ type: 'uuid', nullable: true })
  seo_meta_id: string;

  @ManyToOne(() => SeoMeta)
  @JoinColumn({ name: 'seo_meta_id' })
  seo_meta: SeoMeta;
}
