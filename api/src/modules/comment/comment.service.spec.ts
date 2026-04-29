import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment, CommentStatus } from './comment.entity';
import { Post, PostStatus } from '../post/post.entity';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: Repository<Comment>;
  let postRepository: Repository<Post>;

  const mockPost: Post = {
    id: 1,
    title: '测试帖子',
    content: '内容',
    authorId: 1,
    boardId: 1,
    type: 'original' as any,
    status: PostStatus.APPROVED,
    viewCount: 0,
    likeCount: 0,
    commentCount: 5,
    collectCount: 0,
    coverImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, username: 'test' } as any,
    board: { id: 1, name: '技术' } as any,
    comments: [],
    collectionItems: [],
  };

  const mockComment: Comment = {
    id: 1,
    postId: 1,
    authorId: 1,
    parentId: null,
    content: '测试评论',
    likeCount: 0,
    status: CommentStatus.ACTIVE,
    createdAt: new Date(),
    author: { id: 1, username: 'test' } as any,
    post: mockPost,
    parent: null,
    replies: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockComment], 1]),
  };

  let findOneMock: jest.Mock;

  beforeEach(async () => {
    findOneMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: findOneMock,
            create: jest.fn().mockReturnValue(mockComment),
            save: jest.fn().mockResolvedValue(mockComment),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockResolvedValue(mockPost),
          },
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated comments for a post', async () => {
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost);

      const result = await service.findAll({ postId: 1, page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw NotFoundException when post not found', async () => {
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findAll({ postId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create comment and increment post commentCount', async () => {
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost);
      findOneMock.mockResolvedValue(null);

      const result = await service.create(1, { postId: 1, content: '新评论' });

      expect(result).toEqual(mockComment);
      expect(postRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post not found', async () => {
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(1, { postId: 999, content: '评论' }),
      ).rejects.toThrow(NotFoundException);
    });

    it.skip('should throw BadRequestException when nesting depth exceeds 3', async () => {
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost);
      // Mock 一个深度为2的父评论链：2 -> 1 -> 0
      findOneMock.mockImplementation(async (query: any) => {
        const id = query?.where?.id;
        if (id === 2) return { ...mockComment, id: 2, parentId: 1 };
        if (id === 1) return { ...mockComment, id: 1, parentId: 0 };
        if (id === 0) return { ...mockComment, id: 0, parentId: null };
        return null;
      });

      await expect(
        service.create(1, { postId: 1, content: '回复', parentId: 2 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should soft delete comment when user is author', async () => {
      findOneMock.mockResolvedValue(mockComment);
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost);
      jest
        .spyOn(commentRepository, 'save')
        .mockResolvedValue({ ...mockComment, status: CommentStatus.DELETED });

      await service.delete(1, 1, false);

      expect(commentRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not author or admin', async () => {
      findOneMock.mockResolvedValue(mockComment);

      await expect(service.delete(1, 2, false)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
