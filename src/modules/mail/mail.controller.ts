import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CustomException } from 'src/helper/exceptions/custom-exception';
import CustomResponse from 'src/helper/response/response.type';
import { UserService } from '../user/user.service';
import ConfirmEmailDto from './dtos/confirm-email.dto';
import ResetPasswordEmailDto from './dtos/reset-password-email.dto';
import { MailService } from './mail.service';

/**
 * API cho xử lý email
 * @author : Tr4nLa4m (10-11-2022)
 */
@ApiTags('email')
@Controller('email')
export class MailController {

  //#region Constructor
  constructor(
    private mailService: MailService,
    private userService: UserService,
  ) {}
  //#endregion

  //#region Methods
  /**
   * API thực hiện xác nhận tài khoản 
   * @author : Tr4nLa4m (24-11-2022)
   * @param confirmEmailDto đối tượng truyền dữ liệu mã xác nhận
   * @returns 
   */
  @Post('confirm')
  async confirm(@Req() request : Request ,@Body() confirmEmailDto : ConfirmEmailDto, @Res() response : Response) {
    try {
      const verifyCode = confirmEmailDto.verifyCode;
      var res = 0;
      res = await this.mailService.verifyUserEmail(verifyCode, confirmEmailDto.email);
      return response
        .status(HttpStatus.OK)
        .json(
          new CustomResponse(res, true, 'Xác nhận tài khoản thành công'),
        );
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.url, error.code));
    }
  }

  /**
   * API reset lại mật khẩu
   * @author : Tr4nLa4m (25-11-2022)
   * @param resetPasswordData 
   */
  @Post('reset-password')
  async resetPassword(@Req() request : Request ,@Body() resetPasswordData: ResetPasswordEmailDto, @Res() response : Response) {
    try {
      const verifyCode = resetPasswordData.verifyCode;
      let verifyObj = await this.mailService.checkIsVerify(verifyCode, resetPasswordData.email);
      if(verifyObj.isValid){
        let res = await this.userService.setNewPassword(resetPasswordData.email, resetPasswordData.password);
        return response
        .status(HttpStatus.OK)
        .json(
          new CustomResponse(1, true, 'Reset mật khẩu thành công'),
        );
      }else {
        return response
        .status(HttpStatus.OK)
        .json(
          new CustomResponse(0, false, 'Reset mật khẩu không thành công'),
        );
      }
      
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.url, error.code));
    }
  }

  //#endregion
}
