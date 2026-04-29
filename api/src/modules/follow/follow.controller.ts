import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowTargetType } from './follow.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async follow(
    @Request() req: AuthenticatedRequest,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const type = this.parseTargetType(targetType);
    await this.followService.follow(req.user.userId, Number(targetId), type);
    return { message: '关注成功' };
  }

  @Delete(':targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Request() req: AuthenticatedRequest,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const type = this.parseTargetType(targetType);
    await this.followService.unfollow(req.user.userId, Number(targetId), type);
    return { message: '取消关注成功' };
  }

  @Get('status/:targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async isFollowing(
    @Request() req: AuthenticatedRequest,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const type = this.parseTargetType(targetType);
    const following = await this.followService.isFollowing(
      req.user.userId,
      Number(targetId),
      type,
    );
    return { following };
  }

  @Get('my/followings')
  @UseGuards(JwtAuthGuard)
  async getMyFollowings(
    @Request() req: AuthenticatedRequest,
    @Query('type') type: string = 'user',
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const targetType = this.parseTargetType(type);
    return this.followService.getFollowings(
      req.user.userId,
      targetType,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('my/followers')
  @UseGuards(JwtAuthGuard)
  async getMyFollowers(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.followService.getFollowers(
      req.user.userId,
      FollowTargetType.USER,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('counts/:userId')
  async getFollowCounts(@Param('userId') userId: string) {
    const userFollows = await this.followService.getFollowCounts(
      Number(userId),
      FollowTargetType.USER,
    );
    return userFollows;
  }

  private parseTargetType(type: string): FollowTargetType {
    switch (type) {
      case 'board':
        return FollowTargetType.BOARD;
      case 'tag':
        return FollowTargetType.TAG;
      default:
        return FollowTargetType.USER;
    }
  }
}
