import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reactions')
export class Reaction extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column()
  target_type: string; // article | comment

  @Column('uuid')
  target_id: string;

  @Column()
  type: string; // like | love | angry
}
