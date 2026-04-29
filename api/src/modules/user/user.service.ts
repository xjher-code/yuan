import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';

interface UserDto {
  username?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role?: UserRole;
  status?: UserStatus;
  passwordHash?: string;
  isFirstLogin?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByStudentNo(studentNo: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { studentNo } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(
    userData: UserDto & { studentNo: string; passwordHash: string },
  ): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: number, userData: UserDto): Promise<void> {
    await this.userRepository.update(id, userData);
  }

  async findAll(options: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 20, search } = options;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.studentNo LIKE :search OR user.username LIKE :search',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items, total };
  }
}
