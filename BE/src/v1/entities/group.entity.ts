import { GroupPrivacy, GroupType } from 'src/constants/enums';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupMember } from './group_member.entity';
import { GroupRule } from './group_rule.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('groups')
export class Group extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_url: string;

  @Column({ type: 'enum', enum: GroupPrivacy })
  privacy: GroupPrivacy;

  @Column({ type: 'enum', enum: GroupType, default: GroupType.GENERAL })
  type: GroupType;

  @Column({ type: 'int', default: 0 })
  member_count: number;

  @Column({ type: 'int', default: 0 })
  post_count: number;

  @Column({ type: 'varchar' })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => GroupMember, (gm) => gm.group)
  members: GroupMember[];

  @OneToMany(() => GroupRule, (gr) => gr.group)
  rules: GroupRule[];

  @OneToMany(() => Post, (post) => post.group)
  posts: Post[];
}
