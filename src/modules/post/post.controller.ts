import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { of } from 'rxjs';
import { EmailConfirmGuard } from '../auth/guards/email-confirm.guard';
import JwtAuthGuard from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../auth/interfaces/request-with-user.interface';
import { CreatePostDto } from './dtos/create-post.dto';
import { postStorageOptions } from './helpers/post-file-storage';
import { PostService } from './post.service';
import { FirebaseService } from '../firebase/firebase.service';
import { GetPostByIdDto } from './dtos/get_by_id-post.dto';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  /**
   * API tạo mới một bài đăng
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request
   * @param createPostData Nội dung (text) của bài post
   * @param files Các file tải lên (nếu có)
   * @returns 
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  @UseInterceptors(FileFieldsInterceptor(
    [
      { name: 'images', maxCount: 4 },
      { name: 'video', maxCount: 1 },
    ]
    , postStorageOptions))
  async createPost(
    @Req() request: RequestWithUser,
    @Body() createPostData: CreatePostDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[] },
  ) {
    
      var res = await this.postService.create(request.user.id, createPostData, files);
      return res;
  }

  /**
   * API lấy các bài post qua id
   * @author : Tr4nLa4m (12-11-2022)
   * @param author Id của tác giả
   * @param take Sô bài viết tối đa lấy
   * @param skip Bỏ qua số bài viết trước
   * @returns 
   */
  @Post('get-by-id')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async getPostById(
    @Req() request: RequestWithUser,
    @Body() postIdDto : GetPostByIdDto
  ) {
    return await this.postService.getPostById(request.user.id, postIdDto.postId);
  }

  /**
   * API lấy các bài post của chính tác giả
   * @author : Tr4nLa4m (12-11-2022)
   * @param author Id của tác giả
   * @param take Sô bài viết tối đa lấy
   * @param skip Bỏ qua số bài viết trước
   * @returns 
   */
  @Get('posts-by-user')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async getQuery(
    @Query('author') author: string,
    @Query('take') take: number,
    @Query('skip') skip: number,
  ) {
    take = take > 10 ? 10 : take;
    return await this.postService.findWithAuthor(author, take, skip);
  }

  @Get('post-image/:imagename')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async getPostImage(@Param('imagename') imagename: string, @Res() res) {
    return of(
      res.sendFile(
        join(process.cwd(), './uploads/post/images/584x342/' + imagename),
      ),
    );
  }

  @Delete('delete-post/:postId')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async deletePost(@Param('postId') postId: string) {
    return this.postService.deletePost(postId);
  }

  /**
   * API thích bài viết
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request được gửi đến
   * @param postId Id bài đăng
   * @returns 
   */
  @Put('like-post/:postId')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async likePost(
    @Req() request: RequestWithUser,
    @Param('postId') postId : string){
      const res = await this.postService.likePost(request.user.id, postId);
      return res;
  }
}
