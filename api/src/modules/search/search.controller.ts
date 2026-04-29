import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') q: string,
    @Query('boardId') boardId: string,
    @Query('authorId') authorId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    if (!q) {
      return {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
    return this.searchService.searchPosts({
      q,
      boardId: boardId ? Number(boardId) : undefined,
      authorId: authorId ? Number(authorId) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('users')
  async searchUsers(
    @Query('q') q: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    if (!q) {
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }
    return this.searchService.searchUsers(
      q,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('suggestions')
  async getSuggestions(@Query('q') q: string) {
    return this.searchService.getSuggestions(q || '');
  }

  @Get('trending')
  async getTrending() {
    return this.searchService.getTrending();
  }
}
