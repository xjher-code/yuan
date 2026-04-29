import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { AuthService } from '../auth/auth.service';

interface CreateUserDto {
  studentNo: string;
  username: string;
  role?: UserRole;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
  ) {}

  async findAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, search } = options;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.studentNo LIKE :search OR user.username LIKE :search',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((user) => {
        const { passwordHash, ...rest } = user;
        return rest;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { studentNo: data.studentNo },
    });

    if (existingUser) {
      throw new ConflictException('学号已存在');
    }

    const initialPassword = `${data.studentNo}yuan`;
    const passwordHash = await this.authService.hashPassword(initialPassword);

    const user = this.userRepository.create({
      ...data,
      passwordHash,
      role: data.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      isFirstLogin: true,
    });

    return this.userRepository.save(user);
  }

  async updateUserStatus(id: number, status: UserStatus): Promise<void> {
    const result = await this.userRepository.update(id, { status });
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
  }

  async updateUserRole(id: number, role: UserRole): Promise<void> {
    const result = await this.userRepository.update(id, { role });
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
  }

  async resetPassword(id: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const newPassword = `${user.studentNo}yuan`;
    const passwordHash = await this.authService.hashPassword(newPassword);

    await this.userRepository.update(id, {
      passwordHash,
      isFirstLogin: true,
    });

    return newPassword;
  }
}
