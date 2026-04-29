import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Collection } from './collection.entity';
import { Post } from '../post/post.entity';

@Entity('collection_items')
@Unique(['collectionId', 'postId'])
export class CollectionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collectionId: number;

  @Column()
  postId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Collection, (collection) => collection.items)
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @ManyToOne(() => Post, (post) => post.collectionItems)
  @JoinColumn({ name: 'postId' })
  post: Post;
}
