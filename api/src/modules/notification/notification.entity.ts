import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum NotificationType {
  COMMENT = 'comment',
  REPLY = 'reply',
  LIKE_POST = 'like_post',
  LIKE_COMMENT = 'like_comment',
  COLLECT = 'collect',
  FOLLOW = 'follow',
  AUDIT_RESULT = 'audit_result',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, any> | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'userId' })
  user: User;
}
