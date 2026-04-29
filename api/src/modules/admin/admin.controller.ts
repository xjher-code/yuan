import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '../user/user.entity';

interface CreateUserDto {
  studentNo: string;
  username: string;
  role?: UserRole;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    return this.adminService.findAllUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
  }

  @Post('users')
  async createUser(@Body() body: CreateUserDto) {
    const user = await this.adminService.createUser(body);
    const { passwordHash, ...result } = user;
    return {
      ...result,
      message: '用户创建成功',
      initialPassword: `${body.studentNo}yuan`,
    };
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    await this.adminService.updateUserStatus(Number(id), status);
    return { message: '状态更新成功' };
  }

  @Patch('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    await this.adminService.updateUserRole(Number(id), role);
    return { message: '角色更新成功' };
  }

  @Post('users/:id/reset-password')
  async resetPassword(@Param('id') id: string) {
    const newPassword = await this.adminService.resetPassword(Number(id));
    return { newPassword, message: '密码已重置' };
  }
}
