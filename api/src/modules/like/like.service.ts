import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like, LikeTargetType } from './like.entity';
import { Post } from '../post/post.entity';
import { Comment, CommentStatus } from '../comment/comment.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async like(
    userId: number,
    targetId: number,
    targetType: LikeTargetType,
  ): Promise<Like> {
    // 验证目标存在
    await this.validateTarget(targetId, targetType);

    // 检查是否已点赞
    const existingLike = await this.likeRepository.findOne({
      where: { userId, targetId, targetType },
    });

    if (existingLike) {
      throw new ConflictException('已点赞');
    }

    // 创建点赞记录
    const like = this.likeRepository.create({
      userId,
      targetId,
      targetType,
    });

    const savedLike = await this.likeRepository.save(like);

    // 更新目标点赞数
    await this.updateLikeCount(targetId, targetType, 1);

    return savedLike;
  }

  async unlike(
    userId: number,
    targetId: number,
    targetType: LikeTargetType,
  ): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { userId, targetId, targetType },
    });

    if (!like) {
      throw new NotFoundException('未点赞');
    }

    await this.likeRepository.remove(like);

    // 更新目标点赞数
    await this.updateLikeCount(targetId, targetType, -1);
  }

  async hasLiked(
    userId: number,
    targetId: number,
    targetType: LikeTargetType,
  ): Promise<boolean> {
    const count = await this.likeRepository.count({
      where: { userId, targetId, targetType },
    });
    return count > 0;
  }

  async getUserLikes(
    userId: number,
    targetType: LikeTargetType,
    page = 1,
    limit = 20,
  ) {
    const [items, total] = await this.likeRepository
      .createQueryBuilder('like')
      .where('like.userId = :userId', { userId })
      .andWhere('like.targetType = :targetType', { targetType })
      .orderBy('like.createdAt', 'DESC')
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

  private async validateTarget(
    targetId: number,
    targetType: LikeTargetType,
  ): Promise<void> {
    if (targetType === LikeTargetType.POST) {
      const post = await this.postRepository.findOne({
        where: { id: targetId },
      });
      if (!post) {
        throw new NotFoundException('帖子不存在');
      }
    } else {
      const comment = await this.commentRepository.findOne({
        where: { id: targetId, status: CommentStatus.ACTIVE },
      });
      if (!comment) {
        throw new NotFoundException('评论不存在');
      }
    }
  }

  private async updateLikeCount(
    targetId: number,
    targetType: LikeTargetType,
    delta: number,
  ): Promise<void> {
    if (targetType === LikeTargetType.POST) {
      const post = await this.postRepository.findOne({
        where: { id: targetId },
      });
      if (post) {
        post.likeCount = Math.max(0, post.likeCount + delta);
        await this.postRepository.save(post);
      }
    } else {
      const comment = await this.commentRepository.findOne({
        where: { id: targetId },
      });
      if (comment) {
        comment.likeCount = Math.max(0, comment.likeCount + delta);
        await this.commentRepository.save(comment);
      }
    }
  }
}
