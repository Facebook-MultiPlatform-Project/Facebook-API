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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { of } from 'rxjs';
import { EmailConfirmGuard } from '../auth/guards/email-confirm.guard';
import JwtAuthGuard from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../auth/interfaces/request-with-user.interface';
import { CreatePostDto } from './dtos/create-post.dto';
import { postStorageOptions } from './helpers/post-media-storage';
import { PostService } from './post.service';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  @UseInterceptors(FileInterceptor('file', postStorageOptions))
  async createPost(
    @Req() request: RequestWithUser,
    @Body() createPostData: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.postService.create(request.user.id, createPostData, file);
  }

  @Get('posts-by-user')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async getQuery(
    @Query('author') author: string,
    @Query('take') take: number,
    @Query('skip') skip: number,
  ) {
    take = take > 10 ? 10 : take;
    return this.postService.findWithAuthor(author, take, skip);
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

  @Put('like-post/:postId')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async likePost(
    @Req() request: RequestWithUser,
    @Param('postId') postId : string){
    try {
      const res = await this.postService.likePost(request.user.id, postId);
      return res;
    } catch (exception) {
      throw exception;
    }
  }
}
