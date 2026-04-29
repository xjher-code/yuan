import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum LikeTargetType {
  POST = 'post',
  COMMENT = 'comment',
}

@Entity('likes')
@Unique(['userId', 'targetId', 'targetType'])
@Index(['targetId', 'targetType'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  targetId: number;

  @Column({
    type: 'simple-enum',
    enum: LikeTargetType,
  })
  targetType: LikeTargetType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.likes)
  @JoinColumn({ name: 'userId' })
  user: User;
}
