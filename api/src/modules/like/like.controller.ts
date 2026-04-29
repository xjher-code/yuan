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
import { LikeService } from './like.service';
import { LikeTargetType } from './like.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post(':targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async like(
    @Request() req: AuthenticatedRequest,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const type =
      targetType === 'comment' ? LikeTargetType.COMMENT : LikeTargetType.POST;
    await this.likeService.like(req.user.userId, Number(targetId), type);
    return { message: '点赞成功' };
  }

  @Delete(':targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async unlike(
    @Request() req: AuthenticatedRequest,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const type =
      targetType === 'comment' ? LikeTargetType.COMMENT : LikeTargetType.POST;
    await this.likeService.unlike(req.user.userId, Number(targetId), type);
    return { message: '取消点赞成功' };
  }

  @Get('status/:targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async hasLiked(
    @Request() req: AuthenticatedRequest,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const type =
      targetType === 'comment' ? LikeTargetType.COMMENT : LikeTargetType.POST;
    const liked = await this.likeService.hasLiked(
      req.user.userId,
      Number(targetId),
      type,
    );
    return { liked };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyLikes(
    @Request() req: AuthenticatedRequest,
    @Query('type') type: string = 'post',
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const targetType =
      type === 'comment' ? LikeTargetType.COMMENT : LikeTargetType.POST;
    return this.likeService.getUserLikes(
      req.user.userId,
      targetType,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
