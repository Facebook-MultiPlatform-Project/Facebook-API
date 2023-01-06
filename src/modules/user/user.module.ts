import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
import { UserController } from 'src/modules/user/user.controller';
import { UserService } from 'src/modules/user/user.service';
import { AVATAR_QUEUE } from './user.constants';
import { FileProcessor } from './processors/file.processor';
import BlockUserEntity from 'src/model/entities/block-user.entity';
import { BlockUserRepository } from 'src/model/repositories/block-user.repository';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, BlockUserEntity]),
    BullModule.registerQueue({
      name: AVATAR_QUEUE,
    }),
    FirebaseModule
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService, UserRepository, FileProcessor, BlockUserRepository],
})
export class UserModule {}
