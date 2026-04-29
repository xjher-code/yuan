import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { Follow } from './follow.entity';
import { User } from '../user/user.entity';
import { Board } from '../board/board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User, Board])],
  providers: [FollowService],
  controllers: [FollowController],
  exports: [FollowService],
})
export class FollowModule {}
