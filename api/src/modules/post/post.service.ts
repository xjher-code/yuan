import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus, PostType } from './post.entity';

interface FindAllOptions {
  page?: number;
  limit?: number;
  boardId?: number;
  sort?: 'new' | 'hot';
  authorId?: number;
}

interface PostDto {
  title?: string;
  content?: string;
  boardId?: number;
  coverImage?: string;
  status?: PostStatus;
}

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async findAll(options: FindAllOptions) {
    const { page = 1, limit = 20, boardId, sort = 'new', authorId } = options;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.board', 'board')
      .where('post.status = :status', { status: PostStatus.APPROVED });

    if (boardId) {
      queryBuilder.andWhere('post.boardId = :boardId', { boardId });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    if (sort === 'new') {
      queryBuilder.orderBy('post.createdAt', 'DESC');
    } else {
      queryBuilder
        .addSelect('post.viewCount * 0.1 + post.likeCount * 2', 'hotScore')
        .orderBy('hotScore', 'DESC')
        .addOrderBy('post.createdAt', 'DESC');
    }

    const [items, total] = await queryBuilder
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

  async findById(id: number, incrementView = true): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'board'],
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (incrementView) {
      post.viewCount++;
      await this.postRepository.save(post);
    }

    return post;
  }

  async create(
    data: PostDto & { authorId: number; type?: PostType },
  ): Promise<Post> {
    const post = this.postRepository.create(data);
    return this.postRepository.save(post);
  }

  async update(
    id: number,
    userId: number,
    isAdmin: boolean,
    data: PostDto,
  ): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('无权修改此帖子');
    }

    await this.postRepository.update(id, data);
  }

  async delete(id: number, userId: number, isAdmin: boolean): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('无权删除此帖子');
    }

    await this.postRepository.delete(id);
  }
}
