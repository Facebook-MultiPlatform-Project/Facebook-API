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

  //#region C??c h??m x??? l?? logic ch??nh
  /**
   * L???y b??i ????ng b???i ng?????i d??ng.
   * @param userId id ng?????i d??ng
   * @param postId id b??i ????ng
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
   * L???y ra danh s??ch b??i ????ng c???a m???t ng?????i d??ng
   * @author : Tr4nLa4m (20-11-2022)
   * @param userId Id c???a ng?????i d??ng
   * @param take S??? b???n ghi t???i ??a l???y
   * @param skip S??? b???n ghi b??? qua
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
   * Th???c hi???n th??ch b??i vi???t
   * @author : Tr4nLa4m (22-11-2022)
   * @param userId Id c???a ng?????i d??ng
   * @param postId Id b??i vi???t
   * @returns {Number} 1 n???u c???p nh???t th??nh c??ng d??? li???u, 0 n???u ng?????c l???i
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
    let msg = likePos === -1 ? "???? th??ch b??i vi???t" : "???? b??? th??ch b??i vi???t";
    return new CustomResponse({numLikes : res.likes.length}, true, msg);
  }

  /**
   * T???o b??i vi???t m???i
   * @author : Tr4nLa4m (16-11-2022)
   * @param userId Id ng?????i t???o b??i vi???t
   * @param createPostDto N???i dung b??i vi???t (text)
   * @param files File ???????c truy???n v??o
   * @returns
   */
  async create(
    userId: string,
    createPostDto: CreatePostDto,
    files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    // T???o b??i vi???t m???i
    const newPost = this.postRepo.create(createPostDto);

    // L???y ra t??c gi???
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

    // X??? l?? n???u c?? h??nh ???nh
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
   * C???p nh???t b??i vi???t b???i ng?????i d??ng
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
    // Ki???m tra c??c tr?????ng trong dto, n???u ch??? c?? id th?? throw exception
    if (Object.keys(editPostDto).length === 1) {
      return new CustomResponse(
        null,
        false,
        'B??i vi???t kh??ng ???????c c???p nh???t g?? ',
      );
    }

    // L???y b??i vi???t
    let post = await this.getRawPostById(editPostDto.postId);

    // c???p nh???t c??c tr?????ng
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
      // N???u b??i vi???t k c?? media file ho???c c?? video
      if (
        !post.medias ||
        post.medias.length === 0 ||
        post.medias[0].type === mediaType
      ) {
        throw new UserValidateException(
          ResponseCode.CUSTOM('B??i vi???t kh??ng c?? file c???n xo??', 1003),
          HttpStatus.BAD_REQUEST,
        );
      }
      // L???y danh s??ch id ???nh c???n xo??
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
          // xo?? ???nh trong repo
          await this.mediaRepo.delete({ id: post.medias[mediaIndex].id });
        }
      }
    } else if (editPostDto.hasOwnProperty('image_sort')) {
      if (post.medias && post.medias[0].type === MediaType.VIDEO) {
        throw new UserValidateException(
          ResponseCode.CUSTOM('B??i vi???t ???? c?? video', 1003),
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
          ResponseCode.CUSTOM('B??i vi???t ???? c?? ???nh ho???c video', 1003),
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

  //#region C??c h??m h??? tr???

  /**
   * L???y d??? li???u th?? b??i ????ng
   * @author : Tr4nLa4m (08-01-2023)
   * @param postId id b??i ????ng
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
   * Upload ???nh l??n cloud
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
   * Upload video l??n cloud
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
   * Xo?? b??i vi???t
   * @author : Tr4nLa4m (09.01.2023)
   * @param user ng?????i d??ng
   * @param postId Id b??i vi???t
   * @returns
   */
  async deletePost(postId: string) {
    const post = await this.getRawPostById(postId);
    const res = await this.postRepo.delete(post.id);
    return res.affected;
  }

  /**
   * L???y c???m x??c d???a tr??n Id ng?????i d??ng v?? b??i ????ng
   * @author : Tr4nLa4m (20-11-2022)
   * @param userId Id ng?????i d??ng
   * @param postId Id b??i ????ng
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
   * L???y th??m c??c th??ng tin b??i ????ng
   * @author : Tr4nLa4m (29-12-2022)
   * @param post b??i vi???t
   */
  async getMorePostInfo(post: PostEntity, userId: string) {
    const newPost = { ...post };

    const isLiked = await this.checkLiked(post.id, userId);

    // tr???ng th??i t??c gi??? ???? like b??i vi???t hay ch??a
    newPost['is_liked'] = isLiked;

    const isBlocked = await this.userService.checkIsBlock(
      userId,
      post.author.id,
    );

    // tr???ng th??i user ??ang xem hi???n t???i c?? b??? ch???n hay kh??ng ?
    newPost['is_blocked'] = isBlocked;

    // tr???ng th??i b??i vi???t c?? th??? edit hay kh??ng
    newPost['can_edit'] = post.author.id === userId || !post.isBanned;

    // tr???ng th??i b??i vi???t c?? ??ang b??? ch???n hay kh??ng
    newPost['banned'] = post.isBanned;

    // tr???ng th??i user hi???n t???i c?? th??? comment hay kh??ng
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
   * Ki???m tra quy???n ng?????i d??ng v???i b??i vi???t
   * @author : Tr4nLa4m (09.01.2023)
   * @param user ng?????i d??ng
   * @param postId Id b??i vi???t
   * @param permission quy???n
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
        // ki???m tra c?? ph???i l?? t??c gi??? hay kh??ng
        if (!(post.author.id === user.id)) {
          isPermission = false;
        }
        break;
      case PermissionCode.DELETE:
        // ki???m tra c?? ph???i l?? t??c gi??? hay kh??ng
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
