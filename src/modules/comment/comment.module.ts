import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import CommentEntity from 'src/model/entities/comment.entity';
import PostEntity from 'src/model/entities/post.entity';
import { FriendModule } from '../friend/friend.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, CommentEntity]), FriendModule],
  controllers: [CommentController],
  providers: [CommentService]
})
export class CommentModule {}
