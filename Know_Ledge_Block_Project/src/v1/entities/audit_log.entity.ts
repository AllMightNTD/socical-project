import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column('uuid')
  entity_id: string;

  @Column({ type: 'json', nullable: true })
  old_value: any;

  @Column({ type: 'json', nullable: true })
  new_value: any;

  @CreateDateColumn()
  created_at: Date;
}
