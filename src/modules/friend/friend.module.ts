import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import FriendEntity from 'src/model/entities/friend.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import UserEntity from 'src/model/entities/user.entity';
import { BullModule } from '@nestjs/bull';
import { AVATAR_QUEUE } from '../user/user.constants';
import BlockUserEntity from 'src/model/entities/block-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FriendEntity, UserEntity, BlockUserEntity]), UserModule,
  BullModule.registerQueue({
    name: AVATAR_QUEUE,
  }),],
  providers: [FriendService, UserService],
  exports: [FriendService],
  controllers: [FriendController],
})
export class FriendModule {}
