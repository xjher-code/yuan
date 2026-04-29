import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Draft } from './draft.entity';
import { Post, PostType } from '../post/post.entity';

interface CreateDraftDto {
  boardId?: number;
  title?: string;
  content?: string;
  tags?: string[];
}

@Injectable()
export class DraftService {
  constructor(
    @InjectRepository(Draft)
    private draftRepository: Repository<Draft>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async findByUser(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.draftRepository
      .createQueryBuilder('draft')
      .where('draft.userId = :userId', { userId })
      .orderBy('draft.updatedAt', 'DESC')
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

  async findById(id: number, userId: number): Promise<Draft> {
    const draft = await this.draftRepository.findOne({
      where: { id },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.userId !== userId) {
      throw new ForbiddenException('无权查看此草稿');
    }

    return draft;
  }

  async create(userId: number, data: CreateDraftDto): Promise<Draft> {
    // 检查草稿数量限制（最多20个）
    const count = await this.draftRepository.count({
      where: { userId },
    });

    if (count >= 20) {
      throw new BadRequestException('草稿数量已达上限（20个）');
    }

    const draft = this.draftRepository.create({
      ...data,
      userId,
      tags: data.tags || null,
    });

    return this.draftRepository.save(draft);
  }

  async update(
    id: number,
    userId: number,
    data: CreateDraftDto,
  ): Promise<Draft> {
    const draft = await this.draftRepository.findOne({
      where: { id },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.userId !== userId) {
      throw new ForbiddenException('无权修改此草稿');
    }

    Object.assign(draft, data);
    return this.draftRepository.save(draft);
  }

  async delete(id: number, userId: number): Promise<void> {
    const draft = await this.draftRepository.findOne({
      where: { id },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.userId !== userId) {
      throw new ForbiddenException('无权删除此草稿');
    }

    await this.draftRepository.remove(draft);
  }

  async publish(
    id: number,
    userId: number,
  ): Promise<{ postId: number; message: string }> {
    const draft = await this.draftRepository.findOne({
      where: { id },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.userId !== userId) {
      throw new ForbiddenException('无权发布此草稿');
    }

    if (!draft.title || !draft.content || !draft.boardId) {
      throw new BadRequestException('草稿信息不完整，无法发布');
    }

    const post = this.postRepository.create({
      title: draft.title,
      content: draft.content,
      boardId: draft.boardId,
      authorId: userId,
      type: PostType.ORIGINAL,
    });

    const savedPost = await this.postRepository.save(post);

    // 删除草稿
    await this.draftRepository.remove(draft);

    return { postId: savedPost.id, message: '发布成功' };
  }
}
