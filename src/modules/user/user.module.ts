import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
import { UserController } from 'src/modules/user/user.controller';
import { UserService } from 'src/modules/user/user.service';
import { AVATAR_QUEUE } from './user.constants';
import { AvatarProcessor } from './processors/avatar.processor';
import BlockUserEntity from 'src/model/entities/block-user.entity';
import { BlockUserRepository } from 'src/model/repositories/block-user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, BlockUserEntity]),
    BullModule.registerQueue({
      name: AVATAR_QUEUE,
    }),
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService, UserRepository, AvatarProcessor, BlockUserRepository],
})
export class UserModule {}
