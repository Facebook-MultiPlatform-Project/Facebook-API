import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import * as fs from 'fs';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { EmotionEntity } from 'src/model/entities/emotion.entity';
import PostEntity from 'src/model/entities/post.entity';
import { EmotionRepository } from 'src/model/repositories/like-post.repository';
import { PostRepository } from 'src/model/repositories/post.repository';
import { ResponseCode } from 'src/utils/codes/response.code';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { POST_IMAGE_QUEUE, RESIZING_POST_IMAGE } from './post.constants';

@Injectable()
export class PostService {
  private logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(PostEntity)
    private postRepo: PostRepository,
    @InjectRepository(EmotionEntity)
    private emotionRepo : EmotionRepository,
    @InjectQueue(POST_IMAGE_QUEUE)
    private postImageQueue: Queue,
    private userService: UserService,
  ) {}

  async getPostById(id: string): Promise<PostEntity> {
    return await this.postRepo.findOneBy({ id });
  }

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ): Promise<PostEntity> {
    const newPost = this.postRepo.create(createPostDto);

    const author = await this.userService.getUserById(userId);
    delete author.password;
    delete author.refreshToken;
    delete author.email;
    newPost.author = author;

    if (!file && newPost.content.length === 0) {
      throw new HttpException('Your post is empty', HttpStatus.BAD_REQUEST);
    }

    if (file) {
      newPost.image = file.filename;

      try {
        this.postImageQueue.add(RESIZING_POST_IMAGE, {
          userId,
          createPostDto,
          file,
        });
      } catch (error) {
        this.logger.error(`Failed to send post image ${file} to queue`);
      }
    }

    return await this.postRepo.save(newPost);
  }

  async findWithAuthor(
    userId: string,
    take: number,
    skip: number,
  ): Promise<PostEntity[]> {
    return await this.postRepo
      .createQueryBuilder('P')
      .where('P.authorId = :userId', { userId: userId })
      .orderBy('P.createdAt', 'DESC')
      .take(take)
      .skip(skip)
      .getMany();
  }

  async deletePost(id: string) {
    const post = await this.getPostById(id);

    fs.unlink('./uploads/post/images/584x342/' + post.image, (err) => {
      if (err) {
        console.error(err);
        return err;
      }
    });

    fs.unlink('./uploads/post/images/original/' + post.image, (err) => {
      if (err) {
        console.error(err);
        return err;
      }
    });

    return this.postRepo.delete(id);
  }

  /**
   * Thực hiện thích bài viết
   * @author : Tr4nLa4m (22-11-2022)
   * @param userId Id của người dùng
   * @param postId Id bài viết
   * @returns {Number} 1 nếu cập nhật thành công dữ liệu, 0 nếu ngược lại
   */
  async likePost(userId : string, postId : string): Promise<number>{

    const newLike = this.emotionRepo.create();
    const user = await this.userService.getUserById(userId);
    const post = await this.getPostById(postId);

    if(!user){
      throw new UserValidateException(ResponseCode.USER_NOT_VALIDATED, HttpStatus.BAD_REQUEST);
    }
    if(!post){
      throw new UserValidateException(ResponseCode.POST_NOT_EXIST, HttpStatus.BAD_REQUEST);
    }
    newLike.user = user;
    newLike.post = post;

    const res =  await this.emotionRepo.save(newLike);
    if(res) return 1;
    return 0;
  }
}
