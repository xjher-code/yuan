import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Post } from '../post/post.entity';
import { User } from '../user/user.entity';
import { Board } from '../board/board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Board])],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
