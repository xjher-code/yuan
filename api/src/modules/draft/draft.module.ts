import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DraftService } from './draft.service';
import { DraftController } from './draft.controller';
import { Draft } from './draft.entity';
import { Post } from '../post/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Draft, Post])],
  providers: [DraftService],
  controllers: [DraftController],
  exports: [DraftService],
})
export class DraftModule {}
