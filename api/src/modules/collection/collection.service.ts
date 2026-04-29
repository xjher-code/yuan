import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';
import { CollectionItem } from './collection-item.entity';
import { Post } from '../post/post.entity';

interface CreateCollectionDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
    @InjectRepository(CollectionItem)
    private itemRepository: Repository<CollectionItem>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async findByUser(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.collectionRepository
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.items', 'items')
      .where('collection.userId = :userId', { userId })
      .orderBy('collection.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number, userId?: number) {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ['items', 'items.post', 'items.post.author'],
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (!collection.isPublic && collection.userId !== userId) {
      throw new ForbiddenException('无权查看此收藏夹');
    }

    return collection;
  }

  async create(userId: number, data: CreateCollectionDto): Promise<Collection> {
    const collection = this.collectionRepository.create({
      ...data,
      userId,
      isPublic: data.isPublic ?? true,
    });
    return this.collectionRepository.save(collection);
  }

  async update(
    id: number,
    userId: number,
    data: Partial<CreateCollectionDto>,
  ): Promise<void> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('无权修改此收藏夹');
    }

    await this.collectionRepository.update(id, data);
  }

  async delete(id: number, userId: number): Promise<void> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('无权删除此收藏夹');
    }

    // 先删除所有收藏项
    if (collection.items && collection.items.length > 0) {
      await this.itemRepository.remove(collection.items);
    }

    await this.collectionRepository.remove(collection);
  }

  async addItem(
    collectionId: number,
    userId: number,
    postId: number,
  ): Promise<CollectionItem> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('无权操作此收藏夹');
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查是否已收藏
    const existingItem = await this.itemRepository.findOne({
      where: { collectionId, postId },
    });

    if (existingItem) {
      throw new ConflictException('已收藏此内容');
    }

    const item = this.itemRepository.create({
      collectionId,
      postId,
    });

    const savedItem = await this.itemRepository.save(item);

    // 更新帖子收藏数
    post.collectCount++;
    await this.postRepository.save(post);

    return savedItem;
  }

  async removeItem(
    collectionId: number,
    itemId: number,
    userId: number,
  ): Promise<void> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('无权操作此收藏夹');
    }

    const item = await this.itemRepository.findOne({
      where: { id: itemId, collectionId },
      relations: ['post'],
    });

    if (!item) {
      throw new NotFoundException('收藏项不存在');
    }

    await this.itemRepository.remove(item);

    // 更新帖子收藏数
    if (item.post && item.post.collectCount > 0) {
      item.post.collectCount--;
      await this.postRepository.save(item.post);
    }
  }

  async hasCollected(userId: number, postId: number): Promise<boolean> {
    const count = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.collection', 'collection')
      .where('collection.userId = :userId', { userId })
      .andWhere('item.postId = :postId', { postId })
      .getCount();

    return count > 0;
  }
}
