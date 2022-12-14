import { Controller, Get, HttpStatus, Param, Req, Res, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomException } from 'src/helper/exceptions/custom-exception';
import { EmailConfirmGuard } from '../auth/guards/email-confirm.guard';
import JwtAuthGuard from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../auth/interfaces/request-with-user.interface';
import { FriendService } from '../friend/friend.service';
import { UserService } from '../user/user.service';
import { CommentService } from './comment.service';
import CreateCommentDto from './dtos/create-comment.dto';

/**
 * API cho comment
 * @author : Tr4nLa4m (07-12-2022)
 */
@ApiTags('comment')
@Controller('comment')
export class CommentController {
  //#region Constructur
  constructor(
    private commentService: CommentService,
    private friendService: FriendService,
  ) {}
  //#endregion


  /**
   * API lấy các comment của bài đăng mà người dùng có thể xem (không tính bị chặn)
   * @param request request
   * @param postId Id bài đăng
   * @param response response
   * @returns 
   */
  @Get('all/:postId')
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async getAll(
    @Req() request: RequestWithUser,
    @Param('postId') postId: string,
    @Res() response : Response
  ) {
    try {
      let user = request.user;
      const res =  await this.commentService.getAll(user, postId);
      return response
        .status(HttpStatus.OK)
        .json(res);
    } catch (error) {
      return response.status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR).json(
        new CustomException(error.message, request.path, error.code)
      );
    }
  }

  /**
   * API tạo mới một comment
   * @author : Tr4nLa4m (08-12-2022)
   * @param request request
   * @param createCommentDto dto
   * @param response response
   * @returns 
   */
  @Post()
  @UseGuards(JwtAuthGuard, EmailConfirmGuard)
  async create(
    @Req() request: RequestWithUser,
    @Body() createCommentDto: CreateCommentDto,
    @Res() response : Response
  ) {
    try {
      let user = request.user;
      const res =  await this.commentService.createComment(user, createCommentDto);
      return response
        .status(HttpStatus.OK)
        .json(res);
    } catch (error) {
      return response.status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR).json(
        new CustomException(error.message, request.path, error.code)
      );
    }
  }
}
