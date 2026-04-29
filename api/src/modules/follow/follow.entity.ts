import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum FollowTargetType {
  USER = 'user',
  BOARD = 'board',
  TAG = 'tag',
}

@Entity('follows')
@Unique(['followerId', 'followingId', 'targetType'])
@Index(['followerId', 'targetType'])
@Index(['followingId', 'targetType'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followerId: number;

  @Column()
  followingId: number;

  @Column({
    type: 'simple-enum',
    enum: FollowTargetType,
  })
  targetType: FollowTargetType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.follows)
  @JoinColumn({ name: 'followerId' })
  follower: User;
}
