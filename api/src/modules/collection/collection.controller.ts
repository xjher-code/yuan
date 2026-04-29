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
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/request.types';

interface CreateCollectionDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findMyCollections(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.collectionService.findByUser(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('status/:postId')
  @UseGuards(JwtAuthGuard)
  async hasCollected(
    @Request() req: AuthenticatedRequest,
    @Param('postId') postId: string,
  ) {
    const collected = await this.collectionService.hasCollected(
      req.user.userId,
      Number(postId),
    );
    return { collected };
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const userId = req?.user?.userId;
    return this.collectionService.findById(Number(id), userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateCollectionDto,
  ) {
    const collection = await this.collectionService.create(
      req.user.userId,
      body,
    );
    return { id: collection.id, message: '创建成功' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Partial<CreateCollectionDto>,
  ) {
    await this.collectionService.update(Number(id), req.user.userId, body);
    return { message: '更新成功' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.collectionService.delete(Number(id), req.user.userId);
    return { message: '删除成功' };
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  async addItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('postId') postId: number,
  ) {
    const item = await this.collectionService.addItem(
      Number(id),
      req.user.userId,
      postId,
    );
    return { id: item.id, message: '收藏成功' };
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  async removeItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    await this.collectionService.removeItem(
      Number(id),
      Number(itemId),
      req.user.userId,
    );
    return { message: '移除成功' };
  }
}
