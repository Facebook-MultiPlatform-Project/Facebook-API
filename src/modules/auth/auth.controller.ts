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
import { Request, Response } from 'express';
import { CustomException, UserValidateException } from 'src/helper/exceptions/custom-exception';
import CustomResponse from 'src/helper/response/response.type';
import { CommonMethods } from 'src/utils/common/common.function';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import ForgotPasswordDto from './dtos/forgot-password.dto';
import RegisterDto from './dtos/register.dto';
import VerifyDto from './dtos/verify-code.dto';
import JwtAuthGuard from './guards/jwt-auth.guard';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import RequestWithUser from './interfaces/request-with-user.interface';

// Common methods
const Common = new CommonMethods();

/**
 * API cho một tài khoản
 * @author : Tr4nLa4m (20-11-2022)
 */
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
  async register(@Req() request: Request, @Body() registerDto: RegisterDto, @Res() response: Response) {
    try {
      const user = await this.authService.register(registerDto);
      this.mailService.sendConfirmationEmail(registerDto.email);
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(user, true, "Đã gửi gmail xác thực tài khoản"));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
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

      request.res.header('Access-Control-Allow-Credentials');

      const res = Common.getLessEntityProperties(user, ['id', 'name', 'email', 'avatar', 'cover' ])

      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(res, true, 'Đăng nhập thành công'));
    } catch (error: any) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
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
          new CustomResponse(1, true, 'Gửi email xác nhận lại thành công'),
        );
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
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
        .json(new CustomException(error.message, request.path, error.code));
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
  async authenticate(@Req() request: RequestWithUser,  @Res() response: Response) {
    try {
      const user = request.user;
      const res = Common.getLessEntityProperties(user, ['id', 'name', 'email', 'avatar', 'cover']);
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(res, true, 'OK'));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
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
  async refresh(@Req() request: RequestWithUser, @Res() response: Response) {
    
    try {
      const accessTokenCookie = this.authService.getCookieAccessToken(
        request.user.id,
      );
  
      request.res.setHeader('Set-Cookie', accessTokenCookie);
      const res = Common.getLessEntityProperties(request.user, ['id', 'name', 'email', 'avatar', 'cover'])
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(res, true, 'OK'));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
    }
  }

  /**
   * API quên mật khẩu
   * @author : Tr4nLa4m (15-11-2022)
   * @param forgotPasswordDto dto
   * @returns 
   */
  @Post('forgot-password')
  async handleForgotPassword(@Req() request: RequestWithUser, @Res() response: Response, @Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      const user = await this.authService.checkEmailForgotPassword(
        forgotPasswordDto.forgotPasswordEmail,
      );
      const res = await this.mailService.sendForgotPasswordEmail(user.email);
      return response
        .status(HttpStatus.OK)
        .json(new CustomResponse(1, true, 'Đã gửi email chứa mã xác thực'));
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
    }
    
  }

  /**
   * API kiểm tra mã xác thực
   * @author : Tr4nLa4m (20-11-2022)
   * @param request request
   * @param verify verify dto
   * @param response response
   * @returns 
   */
  @UseGuards(JwtRefreshGuard)
  @Post('check-verify-code')
  async checkVerifyCode(@Req() request: RequestWithUser, @Body() verify : VerifyDto, @Res() response: Response){
    try {
      const user = request.user;
      const res = await this.userService.checkVerifyCode(user.email, verify.verifyCode);
      return response
        .status(HttpStatus.OK)
        .json(res);
    } catch (error) {
      return response
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new CustomException(error.message, request.path, error.code));
    }
  }
}
