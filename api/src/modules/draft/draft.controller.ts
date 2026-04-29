import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DraftService } from './draft.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

interface CreateDraftDto {
  boardId?: number;
  title?: string;
  content?: string;
  tags?: string[];
}

@Controller('drafts')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findMyDrafts(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.draftService.findByUser(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.draftService.findById(Number(id), req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateDraftDto,
  ) {
    const draft = await this.draftService.create(req.user.userId, body);
    return { id: draft.id, message: '创建成功' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreateDraftDto,
  ) {
    const draft = await this.draftService.update(
      Number(id),
      req.user.userId,
      body,
    );
    return { id: draft.id, message: '保存成功' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.draftService.delete(Number(id), req.user.userId);
    return { message: '删除成功' };
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.draftService.publish(Number(id), req.user.userId);
  }
}
