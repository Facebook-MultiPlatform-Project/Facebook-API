import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  CustomException,
  UserValidateException,
} from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';
import JwtAuthGuard from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../auth/interfaces/request-with-user.interface';
import { UserService } from '../user/user.service';
import AcceptFriendDto from './dtos/accept-friend.dto';
import FriendDto from './dtos/friend.dto';
import { FriendService } from './friend.service';

@ApiTags('friends')
@Controller('friends')
export class FriendController {
  //#region Constructur
  constructor(
    private friendService: FriendService,
    private userService: UserService,
  ) {}
  //#endregion

  /**
   * API gửi yêu cầu kết bạn
   * @param request request
   * @param friendDto dữ liệu dto
   * @returns
   */
  @Post('set-request-friend')
  @UseGuards(JwtAuthGuard)
  async setRequest(
    @Req() request: RequestWithUser,
    @Body() friendDto: FriendDto,
  ) {
    let sender = request.user;
    let receiver = await this.userService.getUserById(friendDto.id);
    const res = await this.friendService.setRequest(sender, receiver);
    return res;
  }

  /**
   * API lấy danh sách yêu cầu kết bạn của người dùng
   * @author : Tr4nLa4m (22-11-2022)
   * @param request request
   * @returns
   */
  @Get('get-requested-friends')
  @UseGuards(JwtAuthGuard)
  async getRequests(@Req() request: RequestWithUser) {
    let user = request.user;
    const res = await this.friendService.getRequests(user);
    return res;
  }

  /**
   * API xử lý yêu cầu kết bạn
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request
   * @param acceptDto dữ liệu dto
   * @param response response
   * @returns
   */
  @Post('set-accept-friend')
  @UseGuards(JwtAuthGuard)
  async setAccept(
    @Req() request: RequestWithUser,
    @Body() acceptDto: AcceptFriendDto,
  ) {
    let receiver = request.user;
    let sender = await this.userService.getUserById(acceptDto.id);
    const res = await this.friendService.setAccept(
      sender,
      receiver,
      acceptDto.isAccept,
    );
    return res;
  }

  /**
   * API thực hiện xoá bạn
   * @author : Tr4nLa4m (25-11-2022)
   * @param request request
   * @param friendDto Dữ liệu dto
   * @param response response
   * @returns
   */
  @Put('set-remove-friend')
  @UseGuards(JwtAuthGuard)
  async setRemove(
    @Req() request: RequestWithUser,
    @Body() friendDto: FriendDto,
  ) {
    let user = request.user;
    let friend = await this.userService.getUserById(friendDto.id);
    const res = await this.friendService.setRemove(user, friend);
    return res;
  }

  /**
   * API lấy danh sách bạn bè
   * @author : Tr4nLa4m (28-11-2022)
   * @param request request
   * @param response response
   * @returns
   */
  @Get('get-user-friends')
  @UseGuards(JwtAuthGuard)
  async getFriends(@Req() request: RequestWithUser) {
    let user = request.user;
    const res = await this.friendService.getFriends(user);
    return res;
  }

  /**
   * API huỷ lời mời kết bạn đã gửi đi
   * @author : Tr4nLa4m (24-11-2022)
   * @param request request
   * @param friendDto dữ liệu dto
   * @param response response
   * @returns
   */
  @Post('cancel-request')
  @UseGuards(JwtAuthGuard)
  async cancelRequest(
    @Req() request: RequestWithUser,
    @Body() friendDto: FriendDto,
  ) {
    let sender = request.user;
    let receiver = await this.userService.getUserById(friendDto.id);
    const res = await this.friendService.cancelRequest(sender, receiver);
    return res;
  }

  /**
   * API kiểm trạng thái bạn bè
   * @author : Tr4nLa4m (30-11-2022)
   * @param request request
   * @param userId Id người dùng cần kiểm tra
   * @param response response
   * @returns
   */
  @Get('status/:userId')
  @UseGuards(JwtAuthGuard)
  async getFriendStatus(
    @Req() request: RequestWithUser,
    @Param('userId') userId: string,
  ) {
    let user = request.user;
    let friend = await this.userService.getUserById(userId);
    if (!friend) {
      throw new UserValidateException(
        ResponseCode.PARAMS_TYPE_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }
    const res = await this.friendService.getStatus(user, friend);
    return res;
  }
}
