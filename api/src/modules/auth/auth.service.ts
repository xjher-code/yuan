import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { User, UserStatus } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    studentNo: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userService.findByStudentNo(studentNo);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return user;
  }

  async login(user: User) {
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('账号已被禁用');
    }

    const payload = {
      sub: user.id,
      studentNo: user.studentNo,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        studentNo: user.studentNo,
        username: user.username,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findById(payload.sub);

      if (!user || user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException('无效的令牌');
      }

      const newPayload = {
        sub: user.id,
        studentNo: user.studentNo,
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      };
    } catch {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('原密码错误');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.userService.update(userId, {
      passwordHash: newHash,
      isFirstLogin: false,
    });
  }

  async register(studentNo: string): Promise<{ message: string }> {
    const existing = await this.userService.findByStudentNo(studentNo);
    if (existing) {
      throw new ConflictException('该学号已注册');
    }

    const newPassword = `${studentNo}yuan`;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userService.create({
      studentNo,
      username: studentNo,
      passwordHash,
    });

    return { message: '注册成功，初始密码为学号+yuan' };
  }

  async forgotPassword(studentNo: string): Promise<{ message: string }> {
    const user = await this.userService.findByStudentNo(studentNo);
    if (!user) {
      throw new NotFoundException('该学号不存在');
    }

    const newPassword = `${studentNo}yuan`;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userService.update(user.id, {
      passwordHash,
      isFirstLogin: true,
    });

    return { message: '密码已重置为初始密码，请使用学号+yuan登录' };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
