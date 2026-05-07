import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('seo_meta')
export class SeoMeta extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) meta_title: string;
  @Column({ nullable: true }) meta_description: string;
  @Column({ nullable: true }) meta_keywords: string;
  @Column({ nullable: true }) og_title: string;
  @Column({ nullable: true }) og_description: string;
  @Column({ nullable: true }) og_image: string;
  @Column({ nullable: true }) canonical_url: string;
}
