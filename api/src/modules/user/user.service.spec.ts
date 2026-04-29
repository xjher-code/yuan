import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User, UserRole, UserStatus } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    studentNo: '2024001',
    username: 'test',
    passwordHash: 'hash',
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
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue(mockUser),
            save: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              orWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByStudentNo', () => {
    it('should return user when found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findByStudentNo('2024001');
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findByStudentNo('notfound');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create and return user', async () => {
      const result = await service.create({
        studentNo: '2024001',
        username: 'test',
        passwordHash: 'hash',
      });

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      await service.update(1, { username: 'newname' });

      expect(repository.update).toHaveBeenCalledWith(1, {
        username: 'newname',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const result = await service.findAll({ skip: 0, take: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
