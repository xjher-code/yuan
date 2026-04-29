import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '../../modules/user/user.entity';
import type { AuthenticatedRequest } from '../../common/types/request.types';

interface CreateCommentDto {
  postId: number;
  content: string;
  parentId?: number;
}

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async findAll(
    @Query('postId') postId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    if (!postId) {
      return {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
    return this.commentService.findAll({
      postId: Number(postId),
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateCommentDto,
  ) {
    const comment = await this.commentService.create(req.user.userId, body);
    return { id: comment.id, message: '评论成功' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.commentService.delete(
      Number(id),
      req.user.userId,
      req.user.role === UserRole.ADMIN,
    );
    return { message: '删除成功' };
  }
}
