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
import {
  POST_IMAGE_QUEUE,
  POST_IMAGE_PATH,
  POST_VIDEO_PATH,
  COMMON_POST_PROPERTIES,
} from './post.constants';
import { FirebaseService } from '../firebase/firebase.service';
import { CommonMethods } from 'src/utils/common/common.function';
import { COMMON_USER_PROPERTIES } from '../user/user.constants';
import { MediaType } from './enum/media-type.enum';

const Common = new CommonMethods();

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
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Lấy bài đăng bởi người dùng.
   * @param userId id người dùng
   * @param postId id bài đăng
   * @returns 
   */
  async getPostById(userId : string, postId: string) {
    let rawPost =  await this.postRepo.findOne({
      where : {
        id : postId
      },
      relations: {
        medias : true,
        author : true
      }
    });

    let res = await this.getMorePostInfo(rawPost, userId);

    const result = Common.getLessEntityProperties(res, COMMON_POST_PROPERTIES);

    result['author'] = Common.getLessEntityProperties(result['author'], COMMON_USER_PROPERTIES);
    return result;
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

      for(let index = 0; index < files.images.length; index++){
        let imageUrl: string = '';
        let file = files.images[index];
        try {
          imageUrl = await this.firebaseService.uploadFile(
            file,
            POST_IMAGE_PATH,
          );
        } catch (error) {
          this.logger.error(
            `Failed to upload post image ${file.originalname} to firebase`,
          );
        }

        let image = this.mediaRepo.create();
        image.name = imageUrl;
        images.push(image);
      }

      newPost.medias = images;
      await this.mediaRepo.save(images);
    } else if (files.video) {
      let videoUrl: string = '';
      try {
        videoUrl = await this.firebaseService.uploadFile(
          files.video[0],
          POST_VIDEO_PATH,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload post video ${files.video[0].originalname} to firebase`,
        );
      }

      let video = this.mediaRepo.create();
      video.name = videoUrl;
      video.type = MediaType.VIDEO;
      newPost.medias = [video];
      await this.mediaRepo.save(video);
    }

    let res = await this.getMorePostInfo(await this.postRepo.save(newPost), userId);

    const result = Common.getLessEntityProperties(res, COMMON_POST_PROPERTIES);

    result['author'] = Common.getLessEntityProperties(result['author'], COMMON_USER_PROPERTIES);
    return result;
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
      .leftJoinAndSelect('P.medias', 'media')
      .where('P.authorId = :userId', { userId: userId })
      .orderBy('P.createdAt', 'DESC')
      .take(take)
      .skip(skip)
      .getMany();
  }

  async deletePost(id: string) {
    // const post = await this.getPostById(id);
    // post.medias.forEach((fileName) => {
    //   fs.unlink(
    //     `./uploads/post/images/${NEW_SIZE_WIDTH}x${NEW_SIZE_HEIGHT}/` +
    //       fileName,
    //     (err) => {
    //       if (err) {
    //         console.error(err);
    //         return err;
    //       }
    //     },
    //   );

    //   fs.unlink('./uploads/post/images/original/' + fileName, (err) => {
    //     if (err) {
    //       console.error(err);
    //       return err;
    //     }
    //   });
    // });

    // return this.postRepo.delete(id);
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
    const post = await this.getPostById(postId, userId);

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
    if (oldEmotion) {
      return 0;
    }

    // Nếu chưa thì thêm mới một react
    newLike.user = user;
    // newLike.post = post;

    const res = await this.emotionRepo.save(newLike);
    if (res) return 1;
    return 0;
  }

  /**
   * Lấy cảm xúc dựa trên Id người dùng và bài đăng
   * @author : Tr4nLa4m (20-11-2022)
   * @param userId Id người dùng
   * @param postId Id bài đăng
   * @returns
   */
  async getEmotionByUserAndPost(userId: string, postId: string) {
    return await this.emotionRepo
      .createQueryBuilder('E')
      .where('E.userId = :userId', { userId: userId })
      .andWhere('E.postId = :postId', { postId: postId })
      .orderBy('E.createdAt', 'DESC')
      .getOne();
  }


  /**
   * Lấy thêm câc thông tin bài đăng
   * @author : Tr4nLa4m (29-12-2022)
   * @param post bài viết
   */
  async getMorePostInfo(post : PostEntity, userId : string){
    const newPost = {...post};

    const isLiked = await this.checkLiked(post.id, userId );

    // trạng thái tác giả đã like bài viết hay chưa
    newPost['is_liked'] = isLiked;

    const isBlocked = await this.userService.checkIsBlock(userId, post.author.id);

    // trạng thái user đang xem hiện tại có bị chặn hay không ?
    newPost['is_blocked'] = isBlocked

    // trạng thái bài viết có thể edit hay không
    newPost['can_edit'] = post.author.id === userId || !post.isBanned;

    // trạng thái bài viết có đang bị chặn hay không
    newPost['banned'] = post.isBanned;

    // trạng thái user hiện tại có thể comment hay không
    newPost['can_comment'] = !post.isBlockComment;

    return newPost;
  }

  async checkLiked(postId : string, userId : string){
    const postWithEmotion = await this.postRepo.findOne({
      where: {
        id : postId
      },
      relations: {
        likes : true,
      }
      
    });

    try {
      return postWithEmotion.likes?.some((emotion, index) => {
        return emotion.user.id === postWithEmotion.author.id;
      })
    } catch (error) {
      throw error
    }
  }
}
