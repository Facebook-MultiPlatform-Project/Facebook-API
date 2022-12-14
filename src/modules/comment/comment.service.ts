import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import CommentEntity from 'src/model/entities/comment.entity';
import PostEntity from 'src/model/entities/post.entity';
import UserEntity from 'src/model/entities/user.entity';
import { CommentRepository } from 'src/model/repositories/comment.repository';
import { FriendRepository } from 'src/model/repositories/friend.repository';
import { PostRepository } from 'src/model/repositories/post.repository';
import { ResponseCode } from 'src/utils/codes/response.code';
import { CommonMethods } from 'src/utils/common/common.function';
import CreateCommentDto from './dtos/create-comment.dto';

const Common = new CommonMethods();

@Injectable()
export class CommentService {
  private logger = new Logger(CommentService.name);

  //#region Constructor
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepo: CommentRepository,
    @InjectRepository(PostEntity)
    private postRepo: PostRepository,
  ) {}

  async getAll(user: UserEntity, postId: string) {
    // Lấy bài viết
    let post = await this.postRepo.findOne({
      where: {
        id: postId,
      },
    });

    // Nếu k có bài post => throw exception
    if (!post) {
      throw new UserValidateException(
        ResponseCode.POST_NOT_EXIST,
        HttpStatus.NOT_FOUND,
      );
    }

    // Lấy ra tất cả bình luận của bài đăng.
    
  }

  /**
   * Tạo mới một comment
   * @author : Tr4nLa4m (08-12-2022)
   * @param user người dùng
   * @param createCommentDto dto
   * @returns
   */
  async createComment(user: UserEntity, createCommentDto: CreateCommentDto) {
    // Lấy bài viết
    let post = await this.postRepo.findOne({
      where: {
        id: createCommentDto.postId,
      },
    });
    // Lấy comment được trả lời nếu có
    let commentAnswered = null;
    if (createCommentDto.commentAnsweredId) {
      commentAnswered = await this.commentRepo.findOne({
        where: {
          id: createCommentDto.commentAnsweredId,
        },
      });
    }
    // Nếu k có bài post => throw exception
    if (!post) {
      throw new UserValidateException(
        ResponseCode.POST_NOT_EXIST,
        HttpStatus.NOT_FOUND,
      );
    }

    // Tạo mới comment
    const newComment = this.commentRepo.create({
      user: user,
      post: post,
      content: createCommentDto.content,
      commentAnswered: commentAnswered,
    });

    const commentSaved = await this.commentRepo.save(newComment);
    // Giảm bớt dữ liệu trả về
    commentSaved.post = new PostEntity(
      Common.getLessEntityProperties(commentSaved.post, ['id', 'content']),
    );
    commentSaved.user = new UserEntity(
      Common.getLessEntityProperties(commentSaved.user, [
        'id',
        'name',
        'avatar',
      ]),
    );
    return commentSaved;
  }
}
