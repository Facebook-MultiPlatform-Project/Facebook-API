import {
  Body,
  Controller,
  HttpCode,
  Req,
  Post,
  UseGuards,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import CustomResponse from 'src/helper/response/response.type';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import ForgotPasswordDto from './dtos/forgot-password.dto';
import RegisterDto from './dtos/register.dto';
import JwtAuthGuard from './guards/jwt-auth.guard';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import RequestWithUser from './interfaces/request-with-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private mailService: MailService,
    private authService: AuthService,
    private userService: UserService,
  ) {}

  /**
   * API đăng ký người dùng mới
   * @author : Tr4nLa4m (10-11-2022)
   * @param registerDto Đối tượng dữ liệu cho đăng ký
   * @returns
   */
  @Post('signup')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authService.register(registerDto);
      this.mailService.sendConfirmationEmail(registerDto.email);
      return user;
    } catch (exception: any) {
      throw exception;
    }
  }

  /**
   * API đăng nhập
   * @author : Tr4nLa4m (10-11-2022)
   * @param request Request gửi đến
   * @returns {Promise} user
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() request: RequestWithUser,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const user = request.user;
      const accessTokenCookie = this.authService.getCookieAccessToken(user.id);
      const { cookie: refreshTokenCookie, token: refreshToken } =
        this.authService.getCookieRefreshToken(user.id);

      await this.userService.setRefreshToken(refreshToken, user.id);
      request.res.setHeader('Set-Cookie', [
        accessTokenCookie,
        refreshTokenCookie,
      ]);

      delete user.modifiedAt;
      delete user.createdAt;
      delete user.refreshToken;

      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(user, true, 'Đăng nhập thành công'));
    } catch (error: any) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          code: error.code ? error.code : 9999,
          message: error.message,
          path: request.url,
        });
    }
  }

  /**
   * API xác thực lại
   * @author : Tr4nLa4m (05-11-2022)
   * @param request request
   */
  @UseGuards(JwtAuthGuard)
  @Post('re-verify')
  async resendConfirmEmail(
    @Req() request: RequestWithUser,
    @Res() response: Response,
  ) {
    try {
      let res = await this.mailService.resendConfirmationEmail(request.user.id);
      return response
        .status(HttpStatus.OK)
        .json(
          new CustomResponse(null, true, 'Gửi email xác nhận lại thành công'),
        );
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          code: error.code ? error.code : 9999,
          message: error.message,
          path: request.url,
        });
    }
  }

  /**
   * API đăng xuất
   * @author : Tr4nLa4m (04-11-2022)
   * @param request request
   * @param response response
   * @returns
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
    try {
      await this.userService.removeRefreshToken(request.user.id);
      request.res.setHeader(
        'Set-Cookie',
        this.authService.getCookieForLogOut(),
      );
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(null, true, 'Đăng xuất thành công'));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          code: error.code ? error.code : 9999,
          message: error.message,
          path: request.url,
        });
    }
  }

  /**
   * API lấy người đang đăng nhập
   * @author : Tr4nLa4m (10-11-2022)
   * @param request request
   * @returns
   */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  authenticate(@Req() request: RequestWithUser,  @Res() response: Response) {
    try {
      const user = request.user;
      delete user.createdAt;
      delete user.modifiedAt;
      delete user.password;
      delete user.refreshToken;
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(user, true, 'OK'));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          code: error.code ? error.code : 9999,
          message: error.message,
          path: request.url,
        });
    }
  }

  /**
   * API refresh access token
   * @author : Tr4nLa4m (5-11-2022)
   * @param request request
   * @returns 
   */
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser, @Res() response: Response) {
    
    try {
      const accessTokenCookie = this.authService.getCookieAccessToken(
        request.user.id,
      );
  
      request.res.setHeader('Set-Cookie', accessTokenCookie);
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(request.user, true, 'OK'));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          code: error.code ? error.code : 9999,
          message: error.message,
          path: request.url,
        });
    }
  }

  
  @Post('forgot-password')
  async handleForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authService.checkEmailForgotPassword(
      forgotPasswordDto.forgotPasswordEmail,
    );
    return this.mailService.sendForgotPasswordEmail(user.email);
  }
}
