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
import { EditPostDto } from './dtos/edit-post.dto';
import CustomResponse from 'src/helper/response/response.type';
import { PermissionCode } from './enum/permission-type.enum';
import UserEntity from 'src/model/entities/user.entity';

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

  //#region Các hàm xử lý logic chính
  /**
   * Lấy bài đăng bởi người dùng.
   * @param userId id người dùng
   * @param postId id bài đăng
   * @returns
   */
  async getPostById(userId: string, postId: string) {
    let rawPost = await this.getRawPostById(postId);

    let res = await this.getMorePostInfo(rawPost, userId);

    const result = Common.getLessEntityProperties(res, COMMON_POST_PROPERTIES);

    result['author'] = Common.getLessEntityProperties(
      result['author'],
      COMMON_USER_PROPERTIES,
    );
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

  /**
   * Thực hiện thích bài viết
   * @author : Tr4nLa4m (22-11-2022)
   * @param userId Id của người dùng
   * @param postId Id bài viết
   * @returns {Number} 1 nếu cập nhật thành công dữ liệu, 0 nếu ngược lại
   */
  async likePost(user: UserEntity, postId: string){
    const post = await this.getRawPostById(postId);

    let likePos = -1;
    for(let i = 0 ; i < post.likes.length; ++i){
      let rawLikeEntity = await this.getRawLikeById(post.likes[i].id);
      if(rawLikeEntity.user.id === user.id){
        likePos =  i;
        break;
      }
    }

    if(likePos !== -1){
      await this.emotionRepo.delete(post.likes[likePos].id);
      post.likes.splice(likePos,1);
    }else{
      let newLike = this.emotionRepo.create({
        user : user,
        post : post
      });
      await this.emotionRepo.save(newLike);
      post.likes.push(newLike);
    }


    const res = await this.postRepo.save(post);
    let msg = likePos === -1 ? "Đã thích bài viết" : "Đã bỏ thích bài viết";
    return new CustomResponse({numLikes : res.likes.length}, true, msg);
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
      let images = await this.uploadImage(files.images);
      newPost.medias = images;
      await this.mediaRepo.save(images);
    } else if (files.video) {
      let video = await this.uploadVideo(files.video[0]);
      newPost.medias = [video];
      await this.mediaRepo.save(video);
    }

    let res = await this.getMorePostInfo(
      await this.postRepo.save(newPost),
      userId,
    );

    const result = Common.getLessEntityProperties(res, COMMON_POST_PROPERTIES);

    result['author'] = Common.getLessEntityProperties(
      result['author'],
      COMMON_USER_PROPERTIES,
    );
    return result;
  }

  /**
   * Cập nhật bài viết bởi người dùng
   * @author : Tr4nLa4m (08-01-2023)
   * @param userId Id user
   * @param editPostDto dto
   * @param files file
   * @returns
   */
  async edit(
    userId: string,
    editPostDto: EditPostDto,
    files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    // Kiểm tra các trường trong dto, nếu chỉ có id thì throw exception
    if (Object.keys(editPostDto).length === 1) {
      return new CustomResponse(
        null,
        false,
        'Bài viết không được cập nhật gì ',
      );
    }

    // Lấy bài viết
    let post = await this.getRawPostById(editPostDto.postId);

    // cập nhật các trường
    if (editPostDto.content) {
      post.content = editPostDto.content;
    } else if (editPostDto.hasOwnProperty('status')) {
      post.status = editPostDto.status;
    } else if (
      editPostDto.hasOwnProperty('image_del') ||
      editPostDto.hasOwnProperty('video_del')
    ) {
      const mediaType = editPostDto.hasOwnProperty('image_del')
        ? MediaType.VIDEO
        : MediaType.IMAGE;
      // Nếu bài viết k có media file hoặc có video
      if (
        !post.medias ||
        post.medias.length === 0 ||
        post.medias[0].type === mediaType
      ) {
        throw new UserValidateException(
          ResponseCode.CUSTOM('Bài viết không có file cần xoá', 1003),
          HttpStatus.BAD_REQUEST,
        );
      }
      // Lấy danh sách id ảnh cần xoá
      const listMediaIdDelete = Common.getArrayValueFromString(
        editPostDto.image_del,
        ';',
      );
      for (let i = 0; i < listMediaIdDelete.length; ++i) {
        let mediaIndex = post.medias.findIndex(
          (image) => image.id === listMediaIdDelete[i],
        );
        if (mediaIndex !== -1) {
          post.medias.splice(mediaIndex, 1);
          // xoá ảnh trong repo
          await this.mediaRepo.delete({ id: post.medias[mediaIndex].id });
        }
      }
    } else if (editPostDto.hasOwnProperty('image_sort')) {
      if (post.medias && post.medias[0].type === MediaType.VIDEO) {
        throw new UserValidateException(
          ResponseCode.CUSTOM('Bài viết đã có video', 1003),
          HttpStatus.BAD_REQUEST,
        );
      }
      let imagePos = Common.getArrayValueFromString(
        editPostDto.image_sort,
        ';',
      );
      if (
        post.medias.length + imagePos.length > 4 ||
        !files.images ||
        files.images.length != imagePos.length
      ) {
        throw new UserValidateException(
          ResponseCode.PARAMS_TYPE_INVALID,
          HttpStatus.BAD_REQUEST,
        );
      }

      let images = await this.uploadImage(files.images);
      for (let i = 0; i < images.length; ++i) {
        let index: number = parseInt(imagePos[i]);
        if (index < 0 || index > 4) {
          throw new UserValidateException(
            ResponseCode.PARAMS_TYPE_INVALID,
            HttpStatus.BAD_REQUEST,
          );
        }
        await this.mediaRepo.save(images[i]);
        post.medias.splice(index, 0, images[i]);
      }
    } else if (files.video) {
      if (!(post.medias.length === 0)) {
        throw new UserValidateException(
          ResponseCode.CUSTOM('Bài viết đã có ảnh hoặc video', 1003),
          HttpStatus.BAD_REQUEST,
        );
      }
      post.medias.push(await this.uploadVideo(files.video[0]));
    }

    let res = await this.getMorePostInfo(
      await this.postRepo.save(post),
      userId,
    );

    const result = Common.getLessEntityProperties(res, COMMON_POST_PROPERTIES);

    result['author'] = Common.getLessEntityProperties(
      result['author'],
      COMMON_USER_PROPERTIES,
    );
    return result;
  }

  //#endregion

  //#region Các hàm hỗ trợ

  /**
   * Lấy dữ liệu thô bài đăng
   * @author : Tr4nLa4m (08-01-2023)
   * @param postId id bài đăng
   * @returns
   */
  async getRawPostById(postId: string) {
    let rawPost = await this.postRepo.findOne({
      where: {
        id: postId,
      },
      relations: {
        medias: true,
        author: true,
        likes: true,
      },
    });

    if (!rawPost) {
      throw new UserValidateException(
        ResponseCode.POST_NOT_EXIST,
        HttpStatus.BAD_REQUEST,
      );
    }
    return rawPost;
  }

  async getRawLikeById(likeId : string){
    let rawLike = await this.emotionRepo.findOne({
      where: {
        id: likeId,
      },
      relations: {
        user: true,
      },
    });
    return rawLike;
  }

  /**
   * Upload ảnh lên cloud
   * @author : Tr4nLa4m (08-01-2023)
   * @param images
   * @returns
   */
  async uploadImage(images: Express.Multer.File[]) {
    let imageEntities = [];

    for (let index = 0; index < images.length; index++) {
      let imageUrl: string = '';
      let file = images[index];
      try {
        imageUrl = await this.firebaseService.uploadFile(file, POST_IMAGE_PATH);
      } catch (error) {
        this.logger.error(
          `Failed to upload post image ${file.originalname} to firebase`,
        );
      }

      let image = this.mediaRepo.create();
      image.name = imageUrl;
      image.order = index;
      imageEntities.push(image);
    }

    return imageEntities;
  }

  /**
   * Upload video lên cloud
   * @author : Tr4nLa4m (08-01-202)
   * @param video video
   * @returns
   */
  async uploadVideo(video: Express.Multer.File) {
    let videoUrl: string = '';
    try {
      videoUrl = await this.firebaseService.uploadFile(video, POST_VIDEO_PATH);
    } catch (error) {
      this.logger.error(
        `Failed to upload post video ${video.originalname} to firebase`,
      );
    }

    let videoEntity = this.mediaRepo.create();
    videoEntity.name = videoUrl;
    videoEntity.type = MediaType.VIDEO;
    videoEntity.order = 0;
    return videoEntity;
  }

  /**
   * Xoá bài viết
   * @author : Tr4nLa4m (09.01.2023)
   * @param user người dùng
   * @param postId Id bài viết
   * @returns
   */
  async deletePost(postId: string) {
    const post = await this.getRawPostById(postId);
    const res = await this.postRepo.delete(post.id);
    return res.affected;
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
  async getMorePostInfo(post: PostEntity, userId: string) {
    const newPost = { ...post };

    const isLiked = await this.checkLiked(post.id, userId);

    // trạng thái tác giả đã like bài viết hay chưa
    newPost['is_liked'] = isLiked;

    const isBlocked = await this.userService.checkIsBlock(
      userId,
      post.author.id,
    );

    // trạng thái user đang xem hiện tại có bị chặn hay không ?
    newPost['is_blocked'] = isBlocked;

    // trạng thái bài viết có thể edit hay không
    newPost['can_edit'] = post.author.id === userId || !post.isBanned;

    // trạng thái bài viết có đang bị chặn hay không
    newPost['banned'] = post.isBanned;

    // trạng thái user hiện tại có thể comment hay không
    newPost['can_comment'] = !post.isBlockComment;

    return newPost;
  }

  async checkLiked(postId: string, userId: string) {
    const postWithEmotion = await this.postRepo.findOne({
      where: {
        id: postId,
      },
      relations: {
        likes: true,
      },
    });

    try {
      return postWithEmotion.likes?.some((emotion, index) => {
        return emotion.user.id === postWithEmotion.author.id;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kiểm tra quyền người dùng với bài viết
   * @author : Tr4nLa4m (09.01.2023)
   * @param user người dùng
   * @param postId Id bài viết
   * @param permission quyền
   * @returns
   */
  async checkUserPermission(
    user: UserEntity,
    postId: string,
    permission: string,
  ) {
    const post = await this.getRawPostById(postId);
    if (!post) {
      throw new UserValidateException(
        ResponseCode.POST_NOT_EXIST,
        HttpStatus.BAD_REQUEST,
      );
    }
    let isPermission = true;
    switch (permission) {
      case PermissionCode.EDIT:
        // kiểm tra có phải là tác giả hay không
        if (!(post.author.id === user.id)) {
          isPermission = false;
        }
        break;
      case PermissionCode.DELETE:
        // kiểm tra có phải là tác giả hay không
        if (!(post.author.id === user.id)) {
          isPermission = false;
        }
        break;

      default:
        break;
    }

    if (!isPermission) {
      throw new UserValidateException(
        ResponseCode.USER_HAVE_NO_PERMISSION,
        HttpStatus.FORBIDDEN,
      );
    }

    return;
  }

  //#endregion
}
