import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Board } from '../board/board.entity';
import { Comment } from '../comment/comment.entity';
import { CollectionItem } from '../collection/collection-item.entity';

export enum PostType {
  ORIGINAL = 'original',
  REPOST = 'repost',
}

export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  authorId: number;

  @Column()
  boardId: number;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'simple-enum',
    enum: PostType,
    default: PostType.ORIGINAL,
  })
  type: PostType;

  @Column({
    type: 'simple-enum',
    enum: PostStatus,
    default: PostStatus.APPROVED,
  })
  status: PostStatus;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  collectCount: number;

  @Column({ length: 255, nullable: true })
  coverImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Board, (board) => board.posts)
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => CollectionItem, (item) => item.post)
  collectionItems: CollectionItem[];
}
