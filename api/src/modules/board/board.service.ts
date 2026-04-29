import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './board.entity';

interface BoardDto {
  name?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async findAll(): Promise<Board[]> {
    return this.boardRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Board> {
    const board = await this.boardRepository.findOne({ where: { id } });
    if (!board) {
      throw new NotFoundException('板块不存在');
    }
    return board;
  }

  async create(data: BoardDto): Promise<Board> {
    const board = this.boardRepository.create(data);
    return this.boardRepository.save(board);
  }

  async update(id: number, data: BoardDto): Promise<void> {
    const result = await this.boardRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('板块不存在');
    }
  }

  async delete(id: number): Promise<void> {
    const result = await this.boardRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('板块不存在');
    }
  }

  async seedDefaultBoards(): Promise<void> {
    const count = await this.boardRepository.count();
    if (count > 0) return;

    const defaultBoards = [
      {
        name: '技术分享',
        description: '技术文章、学习笔记、经验分享',
        icon: '💻',
        sortOrder: 1,
      },
      {
        name: '问答交流',
        description: '提问求助、问题讨论',
        icon: '❓',
        sortOrder: 2,
      },
      {
        name: '资源推荐',
        description: '优质资源、工具推荐',
        icon: '📚',
        sortOrder: 3,
      },
      {
        name: '团队公告',
        description: '团队动态、重要通知',
        icon: '📢',
        sortOrder: 0,
      },
    ];

    for (const boardData of defaultBoards) {
      const board = this.boardRepository.create(boardData);
      await this.boardRepository.save(board);
    }
  }
}
