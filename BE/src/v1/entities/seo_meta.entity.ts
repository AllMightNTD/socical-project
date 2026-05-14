import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('seo_meta')
export class SeoMeta extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meta_keywords: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  og_title: string;

  @Column({ type: 'text', nullable: true })
  og_description: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  og_image: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  canonical_url: string;
}
