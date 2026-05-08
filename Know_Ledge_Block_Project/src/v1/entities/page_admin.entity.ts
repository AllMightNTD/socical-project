import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PageAdminRole } from 'src/constants/enums';
import { Page } from './page.entity';
import { User } from './user.entity';

@Entity('page_admins')
export class PageAdmin extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  page_id: string;

  @PrimaryColumn({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'enum', enum: PageAdminRole })
  role: PageAdminRole;

  @CreateDateColumn()
  added_at: Date;

  // ---- Relations ----

  @ManyToOne(() => Page, (page) => page.admins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
