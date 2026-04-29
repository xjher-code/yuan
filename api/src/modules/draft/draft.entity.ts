import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('drafts')
export class Draft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'int', nullable: true })
  boardId: number | null;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[] | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.drafts)
  @JoinColumn({ name: 'userId' })
  user: User;
}
