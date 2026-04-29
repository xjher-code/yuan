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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../modules/user/user.entity';
import type { AuthenticatedRequest } from '../../common/types/request.types';

interface CreatePostDto {
  title: string;
  content: string;
  boardId: number;
  coverImage?: string;
}

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('boardId') boardId: string,
    @Query('sort') sort: 'new' | 'hot' = 'new',
    @Query('authorId') authorId: string,
  ) {
    return this.postService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      boardId: boardId ? Number(boardId) : undefined,
      sort,
      authorId: authorId ? Number(authorId) : undefined,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const post = await this.postService.findById(Number(id), true);
    return { item: post };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreatePostDto,
  ) {
    const post = await this.postService.create({
      ...body,
      authorId: req.user.userId,
    });
    return { id: post.id, message: '发布成功' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Partial<CreatePostDto>,
  ) {
    await this.postService.update(
      Number(id),
      req.user.userId,
      req.user.role === UserRole.ADMIN,
      body,
    );
    return { message: '更新成功' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.postService.delete(
      Number(id),
      req.user.userId,
      req.user.role === UserRole.ADMIN,
    );
    return { message: '删除成功' };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `image-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('只允许上传图片文件'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    };
  }
}
