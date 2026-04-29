import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow, FollowTargetType } from './follow.entity';
import { User } from '../user/user.entity';
import { Board } from '../board/board.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async follow(
    followerId: number,
    followingId: number,
    targetType: FollowTargetType,
  ): Promise<Follow> {
    // 验证目标存在
    await this.validateTarget(followingId, targetType);

    // 不能关注自己
    if (targetType === FollowTargetType.USER && followerId === followingId) {
      throw new ConflictException('不能关注自己');
    }

    // 检查是否已关注
    const existingFollow = await this.followRepository.findOne({
      where: { followerId, followingId, targetType },
    });

    if (existingFollow) {
      throw new ConflictException('已关注');
    }

    const follow = this.followRepository.create({
      followerId,
      followingId,
      targetType,
    });

    return this.followRepository.save(follow);
  }

  async unfollow(
    followerId: number,
    followingId: number,
    targetType: FollowTargetType,
  ): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId, targetType },
    });

    if (!follow) {
      throw new NotFoundException('未关注');
    }

    await this.followRepository.remove(follow);
  }

  async isFollowing(
    followerId: number,
    followingId: number,
    targetType: FollowTargetType,
  ): Promise<boolean> {
    const count = await this.followRepository.count({
      where: { followerId, followingId, targetType },
    });
    return count > 0;
  }

  async getFollowings(
    followerId: number,
    targetType: FollowTargetType,
    page = 1,
    limit = 20,
  ) {
    const queryBuilder = this.followRepository
      .createQueryBuilder('follow')
      .where('follow.followerId = :followerId', { followerId })
      .andWhere('follow.targetType = :targetType', { targetType })
      .orderBy('follow.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (targetType === FollowTargetType.USER) {
      queryBuilder.leftJoinAndSelect('follow.follower', 'follower');
    }

    const [items, total] = await queryBuilder.getManyAndCount();

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

  async getFollowers(
    followingId: number,
    targetType: FollowTargetType,
    page = 1,
    limit = 20,
  ) {
    const [items, total] = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.follower', 'follower')
      .where('follow.followingId = :followingId', { followingId })
      .andWhere('follow.targetType = :targetType', { targetType })
      .orderBy('follow.createdAt', 'DESC')
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

  async getFollowCounts(
    userId: number,
    targetType: FollowTargetType,
  ): Promise<{ following: number; followers: number }> {
    const following = await this.followRepository.count({
      where: { followerId: userId, targetType },
    });

    const followers = await this.followRepository.count({
      where: { followingId: userId, targetType },
    });

    return { following, followers };
  }

  private async validateTarget(
    targetId: number,
    targetType: FollowTargetType,
  ): Promise<void> {
    if (targetType === FollowTargetType.USER) {
      const user = await this.userRepository.findOne({
        where: { id: targetId },
      });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
    } else if (targetType === FollowTargetType.BOARD) {
      const board = await this.boardRepository.findOne({
        where: { id: targetId },
      });
      if (!board) {
        throw new NotFoundException('板块不存在');
      }
    }
    // tag 类型暂不验证
  }
}
