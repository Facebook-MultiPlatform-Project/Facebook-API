import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { of } from 'rxjs';
import { UserService } from 'src/modules/user/user.service';
import JwtAuthGuard from '../auth/guards/jwt-auth.guard';
import { join } from 'path';
import RequestWithUser from '../auth/interfaces/request-with-user.interface';
import UpdateProfileDto from './dtos/update-profile.dto';
import { imageStorageOption } from './helpers/image-file-storage';
import { Response } from 'express';
import CustomResponse from 'src/helper/response/response.type';
import BlockUserDto from './dtos/block-user.dto';
import { FirebaseService } from '../firebase/firebase.service';

/**
 * API cho người dùng
 * @author : Tr4nLa4m (10-11-2022)
 */
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
  ) {}

  /**
   * API Thực hiện cập nhật thông tin người dùng
   * @author : Tr4nLa4m (16-11-2022)
   * @param request Request đầu vào
   * @param userData Dữ liệu người dùng
   * @returns {Promise}
   */
  @Put('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() request: RequestWithUser,
    @Body() userData: UpdateProfileDto,
  ): Promise<any> {
      const res = await this.userService.updateProfile(
        request.user.id,
        userData,
      );
      return new CustomResponse(res, true, 'Đã cập nhật thông tin người dùng');

  }

  /**
   * API Thực hiện cập nhật avatar
   * @param file File ảnh truyền vào
   * @param request Đối tượng yêu cầu
   * @returns {Promise}
   */
  @Post('save-avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', imageStorageOption))
  async saveAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: RequestWithUser,
  ): Promise<any> {
    const res = await this.userService.saveAvatar(request.user , file);
    return res;
  }

  /**
   * API Thực hiện cập nhật ảnh nền
   * @param file File ảnh truyền vào
   * @param request Đối tượng yêu cầu
   * @returns {Promise}
   */
  @Post('save-cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', imageStorageOption))
  async saveCover(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: RequestWithUser,
  ): Promise<any> {
    const res = await this.userService.saveCover(request.user , file);
    return res;
  }

  /**
   * API Lấy file ảnh đại diện size 40x40
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request
   * @param res response
   * @returns
   */
  // @Get('get-avatar-40x40')
  // @UseGuards(JwtAuthGuard)
  // async findAvatar40(@Req() request: RequestWithUser, @Res() res: Response) {
  //   const user = await this.userService.getUserById(request.user.id);

  //   return of(
  //     res.sendFile(
  //       join(process.cwd(), './uploads/avatars/40x40/' + user.avatar),
  //     ),
  //   );
  // }

  /**
   * API lấy file ảnh size 70x70
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request
   * @param res response
   * @returns
   */
  // @Get('get-avatar-70x70')
  // @UseGuards(JwtAuthGuard)
  // async findAvatar70(@Req() request: RequestWithUser, @Res() res: Response) {
  //   const user = await this.userService.getUserById(request.user.id);

  //   return of(
  //     res.sendFile(
  //       join(process.cwd(), './uploads/avatars/70x70/' + user.avatar),
  //     ),
  //   );
  // }

  /**
   * API lấy ảnh đại diện gốc
   * @author :Tr4nLa4m (20-11-2022)
   * @param request request
   * @param res response
   * @returns
   */
  // @Get('get-avatar-original')
  // @UseGuards(JwtAuthGuard)
  // async findAvatar(@Req() request: RequestWithUser, @Res() res: Response) {
  //   const user = await this.userService.getUserById(request.user.id);

  //   return of(
  //     res.sendFile(
  //       join(process.cwd(), './uploads/avatars/original/' + user.avatar),
  //     ),
  //   );
  // }

  /**
   * API lấy ảnh nền gốc
   * @author :Tr4nLa4m (20-11-2022)
   * @param request request
   * @param res response
   * @returns
   */
  // @Get('get-cover-original')
  // @UseGuards(JwtAuthGuard)
  // async findCover(@Req() request: RequestWithUser, @Res() res: Response) {
  //   const user = await this.userService.getUserById(request.user.id);

  //   return of(
  //     res.sendFile(
  //       join(process.cwd(), './uploads/covers/original/' + user.cover),
  //     ),
  //   );
  // }

  /**
   * API xoá ảnh đại diện
   * @param request request
   * @returns
   */
  @Delete('delete-avatar')
  @UseGuards(JwtAuthGuard)
  async deleteAvatar(@Req() request: RequestWithUser) {
    const res = this.userService.deleteAvatar(request.user.id);

    return new CustomResponse(1, true, 'Đã xoá ảnh đại diện');
  }

  /**
   * API lấy danh sách người bị chặn
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request
   * @param response response
   * @returns
   */
  @Get('block-list')
  @UseGuards(JwtAuthGuard)
  async getBlockList(@Req() request: RequestWithUser) {
    const user = request.user;
    const res = this.userService.getBlockList(user);

    return res;
  }

  /**
   * API chặn / bỏ chặn người dùng khác
   * @param request request
   * @param blockDto dto block
   * @param response response
   * @returns
   */
  @Post('block')
  @UseGuards(JwtAuthGuard)
  async setBlock(
    @Req() request: RequestWithUser,
    @Body() blockDto: BlockUserDto,
  ) {
    const user = request.user;
    const blockedId = blockDto.userId;
    const type = blockDto.type;
    const res = this.userService.setBlock(user, blockedId, type);

    return res;
  }
}
