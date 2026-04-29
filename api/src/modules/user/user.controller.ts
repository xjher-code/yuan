import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      return { message: '用户不存在' };
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  @Get(':id/profile')
  async getProfile(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  @Patch('me')
  async updateMe(
    @Request() req: AuthenticatedRequest,
    @Body() body: { username?: string; avatar?: string },
  ) {
    await this.userService.update(req.user.userId, body);
    return { message: '更新成功' };
  }
}
