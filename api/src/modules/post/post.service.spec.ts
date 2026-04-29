import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostService } from './post.service';
import { Post, PostStatus, PostType } from './post.entity';

describe('PostService', () => {
  let service: PostService;
  let repository: Repository<Post>;

  const mockPost = {
    id: 1,
    title: '测试帖子',
    content: '测试内容',
    authorId: 1,
    boardId: 1,
    type: PostType.ORIGINAL,
    status: PostStatus.APPROVED,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    collectCount: 0,
    coverImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, username: 'test' },
    board: { id: 1, name: '技术' },
    comments: [],
    collectionItems: [],
  } as Post;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockPost], 1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue(mockPost),
            save: jest.fn().mockResolvedValue(mockPost),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated posts sorted by new', async () => {
      const result = await service.findAll({ page: 1, limit: 20, sort: 'new' });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'post.createdAt',
        'DESC',
      );
    });

    it('should return paginated posts sorted by hot', async () => {
      const result = await service.findAll({ page: 1, limit: 20, sort: 'hot' });

      expect(result.items).toHaveLength(1);
      expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
    });

    it('should filter by boardId', async () => {
      await service.findAll({ page: 1, limit: 20, boardId: 1 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'post.boardId = :boardId',
        { boardId: 1 },
      );
    });
  });

  describe('findById', () => {
    it('should return post and increment view count', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPost);
      jest.spyOn(repository, 'save').mockResolvedValue(mockPost);

      const result = await service.findById(1);

      expect(result).toEqual(mockPost);
      expect(mockPost.viewCount).toBe(1);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('帖子不存在');
    });
  });

  describe('create', () => {
    it('should create and return post', async () => {
      const result = await service.create({
        title: '测试',
        content: '内容',
        boardId: 1,
        authorId: 1,
      });

      expect(result).toEqual(mockPost);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update post when user is author', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPost);

      await service.update(1, 1, false, { title: '新标题' });

      expect(repository.update).toHaveBeenCalledWith(1, { title: '新标题' });
    });

    it('should throw ForbiddenException when user is not author or admin', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPost);

      await expect(
        service.update(1, 2, false, { title: '新标题' }),
      ).rejects.toThrow('无权修改此帖子');
    });
  });

  describe('delete', () => {
    it('should delete post when user is author', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPost);

      await service.delete(1, 1, false);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw ForbiddenException when user is not author or admin', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPost);

      await expect(service.delete(1, 2, false)).rejects.toThrow(
        '无权删除此帖子',
      );
    });
  });
});
