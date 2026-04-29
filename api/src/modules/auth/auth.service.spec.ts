import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User, UserRole, UserStatus } from '../user/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    studentNo: '2024001',
    username: 'test',
    passwordHash: '$2b$12$testhash',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    isFirstLogin: false,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    comments: [],
    likes: [],
    follows: [],
    collections: [],
    notifications: [],
    drafts: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByStudentNo: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn().mockReturnValue({ sub: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      jest.spyOn(userService, 'findByStudentNo').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('2024001', 'password');
      expect(result).toEqual(mockUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        mockUser.passwordHash,
      );
    });

    it('should return null when user not found', async () => {
      jest.spyOn(userService, 'findByStudentNo').mockResolvedValue(null);

      const result = await service.validateUser('2024001', 'password');
      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password does not match', async () => {
      jest.spyOn(userService, 'findByStudentNo').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('2024001', 'wrong');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should throw ForbiddenException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };

      await expect(service.login(inactiveUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return tokens and user info when login succeeds', async () => {
      const result = await service.login(mockUser);

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        studentNo: mockUser.studentNo,
        username: mockUser.username,
        role: mockUser.role,
        isFirstLogin: mockUser.isFirstLogin,
        avatarUrl: mockUser.avatarUrl,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      jest
        .spyOn(userService, 'findById')
        .mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE });

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should update password when old password is correct', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      jest.spyOn(userService, 'update').mockResolvedValue(undefined);

      await service.changePassword(1, 'old-pass', 'new-pass');

      expect(userService.update).toHaveBeenCalledWith(1, {
        passwordHash: 'new-hash',
        isFirstLogin: false,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(null);

      await expect(service.changePassword(1, 'old', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when old password is wrong', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('hashPassword', () => {
    it('should return hashed password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.hashPassword('password');

      expect(result).toBe('hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 12);
    });
  });
});
