import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

interface LoginDto {
  studentNo: string;
  password: string;
}

interface ForgotPasswordDto {
  studentNo: string;
}

interface RegisterDto {
  studentNo: string;
}

interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(
      body.studentNo,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('学号或密码错误');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.studentNo);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.studentNo);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return { message: '登出成功' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
    return { message: '密码修改成功' };
  }
}
