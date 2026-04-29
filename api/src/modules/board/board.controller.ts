import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface CreateBoardDto {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  async findAll() {
    const boards = await this.boardService.findAll();
    return { items: boards };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() body: CreateBoardDto) {
    const board = await this.boardService.create(body);
    return { id: board.id, message: '创建成功' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() body: Partial<CreateBoardDto>) {
    await this.boardService.update(Number(id), body);
    return { message: '更新成功' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    await this.boardService.delete(Number(id));
    return { message: '删除成功' };
  }
}
