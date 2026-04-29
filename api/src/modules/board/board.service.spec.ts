import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardService } from './board.service';
import { Board } from './board.entity';

describe('BoardService', () => {
  let service: BoardService;
  let repository: Repository<Board>;

  const mockBoard: Board = {
    id: 1,
    name: '技术交流',
    description: '技术讨论板块',
    icon: '💻',
    sortOrder: 0,
    createdAt: new Date(),
    posts: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: getRepositoryToken(Board),
          useValue: {
            find: jest.fn().mockResolvedValue([mockBoard]),
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue(mockBoard),
            save: jest.fn().mockResolvedValue(mockBoard),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            count: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    repository = module.get<Repository<Board>>(getRepositoryToken(Board));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all boards ordered by sortOrder', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockBoard]);
      expect(repository.find).toHaveBeenCalledWith({
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create and return board', async () => {
      const result = await service.create({
        name: '技术交流',
        description: '技术讨论',
        icon: '💻',
      });

      expect(result).toEqual(mockBoard);
    });
  });

  describe('update', () => {
    it('should update board', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockBoard);

      await service.update(1, { name: '新技术' });

      expect(repository.update).toHaveBeenCalledWith(1, { name: '新技术' });
    });
  });

  describe('delete', () => {
    it('should delete board', async () => {
      await service.delete(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('seedDefaultBoards', () => {
    it('should create default boards if none exist', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(0);

      await service.seedDefaultBoards();

      expect(repository.create).toHaveBeenCalledTimes(4);
      expect(repository.save).toHaveBeenCalledTimes(4);
    });

    it('should not create boards if already exist', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(1);

      await service.seedDefaultBoards();

      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
