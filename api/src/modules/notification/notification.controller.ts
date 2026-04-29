import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findMyNotifications(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('unreadOnly') unreadOnly: string,
  ) {
    return this.notificationService.findByUser(req.user.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.notificationService.markAsRead(req.user.userId, Number(id));
    return { message: '标记已读成功' };
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    await this.notificationService.markAllAsRead(req.user.userId);
    return { message: '全部已读成功' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.notificationService.delete(req.user.userId, Number(id));
    return { message: '删除成功' };
  }
}
