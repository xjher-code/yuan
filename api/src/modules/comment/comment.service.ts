import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStatus } from './comment.entity';
import { Post, PostStatus } from '../post/post.entity';

interface CreateCommentDto {
  postId: number;
  content: string;
  parentId?: number;
}

interface FindAllOptions {
  postId: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async findAll(options: FindAllOptions) {
    const { postId, page = 1, limit = 20 } = options;

    // 验证帖子存在且已审核通过
    const post = await this.postRepository.findOne({
      where: { id: postId, status: PostStatus.APPROVED },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 获取所有评论
    const [items, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.status = :status', { status: CommentStatus.ACTIVE })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 构建嵌套结构
    const rootComments = items.filter((c) => !c.parentId);
    const replyMap = new Map<number, Comment[]>();

    items.forEach((comment) => {
      if (comment.parentId) {
        const replies = replyMap.get(comment.parentId) || [];
        replies.push(comment);
        replyMap.set(comment.parentId, replies);
      }
    });

    const buildTree = (comment: Comment): Comment & { replies?: Comment[] } => {
      const replies = replyMap.get(comment.id) || [];
      return {
        ...comment,
        replies: replies.map(buildTree),
      };
    };

    const treeItems = rootComments.map(buildTree);

    return {
      items: treeItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(authorId: number, data: CreateCommentDto): Promise<Comment> {
    const { postId, content, parentId } = data;

    // 验证帖子存在
    const post = await this.postRepository.findOne({
      where: { id: postId, status: PostStatus.APPROVED },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 验证父评论存在且属于同一帖子
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId, postId, status: CommentStatus.ACTIVE },
      });
      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      // 检查层级深度（最多3层）
      const depth = await this.getCommentDepth(parentId);
      if (depth >= 2) {
        throw new BadRequestException('评论嵌套层级最多3层');
      }
    }

    // 创建评论
    const comment = this.commentRepository.create({
      postId,
      authorId,
      content,
      parentId: parentId || null,
      status: CommentStatus.ACTIVE,
    });

    const savedComment = await this.commentRepository.save(comment);

    // 更新帖子评论数
    post.commentCount++;
    await this.postRepository.save(post);

    return savedComment;
  }

  async delete(
    commentId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['post'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('无权删除此评论');
    }

    // 软删除
    comment.status = CommentStatus.DELETED;
    await this.commentRepository.save(comment);

    // 更新帖子评论数
    const post = await this.postRepository.findOne({
      where: { id: comment.postId },
    });
    if (post && post.commentCount > 0) {
      post.commentCount--;
      await this.postRepository.save(post);
    }
  }

  private async getCommentDepth(commentId: number): Promise<number> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment || !comment.parentId) {
      return 0;
    }
    return 1 + (await this.getCommentDepth(comment.parentId));
  }
}
