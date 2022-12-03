import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import * as fs from 'fs';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { EmotionEntity } from 'src/model/entities/emotion.entity';
import MediaEntity from 'src/model/entities/media.entity';
import PostEntity from 'src/model/entities/post.entity';
import { EmotionRepository } from 'src/model/repositories/like-post.repository';
import { MediaRepository } from 'src/model/repositories/media.repository';
import { PostRepository } from 'src/model/repositories/post.repository';
import { ResponseCode } from 'src/utils/codes/response.code';
import { UserService } from '../user/user.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { mapSendPost, SendPostDto } from './dtos/send-post.dto';
import { merge } from "object-mapper";
import {
  POST_IMAGE_QUEUE,
  RESIZING_POST_IMAGE,
  NEW_SIZE_HEIGHT,
  NEW_SIZE_WIDTH,
} from './post.constants';

@Injectable()
export class PostService {
  private logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(PostEntity)
    private postRepo: PostRepository,
    @InjectRepository(EmotionEntity)
    private emotionRepo: EmotionRepository,
    @InjectRepository(MediaEntity)
    private mediaRepo: MediaRepository,
    @InjectQueue(POST_IMAGE_QUEUE)
    private postImageQueue: Queue,
    private userService: UserService,
  ) {}

  async getPostById(id: string): Promise<PostEntity> {
    return await this.postRepo.findOneBy({ id });
  }

  /**
   * Tạo bài viết mới
   * @author : Tr4nLa4m (16-11-2022)
   * @param userId Id người tạo bài viết
   * @param createPostDto Nội dung bài viết (text)
   * @param files File được truyền vào
   * @returns
   */
  async create(
    userId: string,
    createPostDto: CreatePostDto,
    files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    try {
      // Tạo bài viết mới
      const newPost = this.postRepo.create(createPostDto);

      // Lấy ra tác giả
      const author = await this.userService.getUserById(userId);

      newPost.author = author;

      if (!files && newPost.content.length === 0) {
        throw new UserValidateException(
          ResponseCode.PARAMS_NOT_ENOUGHT,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (files.images && files.video) {
        throw new UserValidateException(
          ResponseCode.PARAMS_TYPE_INVALID,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Xử lý nếu có hình ảnh
      if (files.images) {
        const images = [];
        files.images.forEach((file, index) => {
          let image = this.mediaRepo.create();
          image.name = file.filename;
          images.push(image);

          try {
            this.postImageQueue.add(RESIZING_POST_IMAGE, {
              userId,
              createPostDto,
              file,
            });
          } catch (error) {
            this.logger.error(`Failed to send post image ${file} to queue`);
          }
        });

        newPost.medias = images;
        await this.mediaRepo.save(images);
      } else if (files.video) {
        let video = this.mediaRepo.create();
        video.name = files.video[0].filename;
        newPost.medias = [video];
        await this.mediaRepo.save(video);
      }

      var res =  await this.postRepo.save(newPost);

      var result = merge(res, mapSendPost);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Lấy ra danh sách bài đăng của một người dùng
   * @author : Tr4nLa4m (20-11-2022)
   * @param userId Id của người dùng
   * @param take Số bản ghi tối đa lấy
   * @param skip Số bản ghi bỏ qua
   * @returns 
   */
  async findWithAuthor(
    userId: string,
    take: number,
    skip: number,
  ): Promise<PostEntity[]> {
    return await this.postRepo
      .createQueryBuilder('P')
      .leftJoinAndSelect("P.medias", "media")
      .where('P.authorId = :userId', { userId: userId })
      .orderBy('P.createdAt', 'DESC')
      .take(take)
      .skip(skip)
      .getMany();
  }

  async deletePost(id: string) {
    const post = await this.getPostById(id);
    post.medias.forEach((fileName) => {
      fs.unlink(
        `./uploads/post/images/${NEW_SIZE_WIDTH}x${NEW_SIZE_HEIGHT}/` +
          fileName,
        (err) => {
          if (err) {
            console.error(err);
            return err;
          }
        },
      );

      fs.unlink('./uploads/post/images/original/' + fileName, (err) => {
        if (err) {
          console.error(err);
          return err;
        }
      });
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
  async likePost(userId: string, postId: string): Promise<number> {
    const newLike = this.emotionRepo.create();
    const user = await this.userService.getUserById(userId);
    const post = await this.getPostById(postId);

    // Nếu không tìm thấy người dùng
    if (!user) {
      throw new UserValidateException(
        ResponseCode.USER_NOT_VALIDATED,
        HttpStatus.BAD_REQUEST,
      );
    }
    // Nếu không tìm thấy bài viết
    if (!post) {
      throw new UserValidateException(
        ResponseCode.POST_NOT_EXIST,
        HttpStatus.BAD_REQUEST,
      );
    }
    // Nếu đã react bài viết này rồi
    const oldEmotion = this.getEmotionByUserAndPost(userId, postId);
    if(oldEmotion){
      return 0;
    }

    // Nếu chưa thì thêm mới một react
    newLike.user = user;
    newLike.post = post;

    const res = await this.emotionRepo.save(newLike);
    if (res) return 1;
    return 0;
  }

  /**
   * Lấy cảm xúc dựa trên Id người dùng vài bài đăng
   * @author : Tr4nLa4m (20-11-2022)
   * @param userId Id người dùng
   * @param postId Id bài đăng
   * @returns 
   */
  async getEmotionByUserAndPost(userId : string, postId : string){
    return await this.emotionRepo
      .createQueryBuilder('E')
      .where('E.userId = :userId', { userId: userId })
      .andWhere('E.postId = :postId', {postId : postId})
      .orderBy('E.createdAt', 'DESC')
      .getOne();
  }

}
