import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as TypeOrmLike } from 'typeorm';
import { Post, PostStatus } from '../post/post.entity';
import { User } from '../user/user.entity';
import { Board } from '../board/board.entity';

interface SearchOptions {
  q: string;
  boardId?: number;
  authorId?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async searchPosts(options: SearchOptions) {
    const { q, boardId, authorId, page = 1, limit = 20 } = options;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.board', 'board')
      .where('post.status = :status', { status: PostStatus.APPROVED })
      .andWhere('(post.title LIKE :q OR post.content LIKE :q)', {
        q: `%${q}%`,
      });

    if (boardId) {
      queryBuilder.andWhere('post.boardId = :boardId', { boardId });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    const [items, total] = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
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

  async searchUsers(q: string, page = 1, limit = 10) {
    const [items, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :q OR user.studentNo LIKE :q', { q: `%${q}%` })
      .andWhere('user.status = :status', { status: 'active' })
      .select(['user.id', 'user.username', 'user.studentNo', 'user.avatarUrl'])
      .orderBy('user.createdAt', 'DESC')
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

  async getSuggestions(q: string) {
    if (!q || q.length < 1) {
      return { posts: [], users: [], boards: [] };
    }

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.title LIKE :q', { q: `%${q}%` })
      .andWhere('post.status = :status', { status: PostStatus.APPROVED })
      .select(['post.id', 'post.title'])
      .orderBy('post.createdAt', 'DESC')
      .take(5)
      .getMany();

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :q', { q: `%${q}%` })
      .select(['user.id', 'user.username', 'user.avatarUrl'])
      .take(5)
      .getMany();

    const boards = await this.boardRepository
      .createQueryBuilder('board')
      .where('board.name LIKE :q', { q: `%${q}%` })
      .select(['board.id', 'board.name'])
      .take(5)
      .getMany();

    return { posts, users, boards };
  }

  async getTrending() {
    // 返回最近7天热门搜索关键词（简化实现：返回热门帖子标题关键词）
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.status = :status', { status: PostStatus.APPROVED })
      .andWhere('post.createdAt > :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .orderBy('post.viewCount', 'DESC')
      .addOrderBy('post.likeCount', 'DESC')
      .take(10)
      .select(['post.id', 'post.title'])
      .getMany();

    return { items: posts };
  }
}
