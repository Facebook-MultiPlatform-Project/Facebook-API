import {
  Body,
  Controller,
  Req,
  Post,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import CustomResponse from 'src/helper/response/response.type';
import { CommonMethods } from 'src/utils/common/common.function';
import ConfirmEmailDto from '../mail/dtos/confirm-email.dto';
import ResetPasswordEmailDto from '../mail/dtos/reset-password-email.dto';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import ForgotPasswordDto from './dtos/forgot-password.dto';
import { UserLoginDto } from './dtos/login.dto';
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
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    await this.mailService.sendConfirmationEmail(registerDto.email);
    return new CustomResponse(user, true, 'Đã gửi gmail xác thực tài khoản');
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
    @Body() userDto: UserLoginDto,
  ): Promise<any> {
    const user = request.user;
    let accessToken = user.token;
    let accessCookieToken = this.authService.getCookieAccessString(accessToken);
    if (user.uuid !== userDto.uuid || !user.token) {
      const accessTokenData = this.authService.getCookieAccessToken(user.id);
      accessToken = accessTokenData.accessToken;
      accessCookieToken = accessTokenData.accessCookieToken;

      await this.userService.setRefreshToken(accessToken, user.id);
    }

    request.res.setHeader('Set-Cookie', [accessCookieToken]);

    // Cho phép trên mọi port
    request.res.header('Access-Control-Allow-Credentials');

    // Trả về thông tin người dùng
    let resUser = Common.getLessEntityProperties(user, [
      'id',
      'name',
      'email',
      'avatar',
      'cover',
    ]);

    const res = {
      user : resUser,
      token : accessToken
    }

    return new CustomResponse(res, true, 'Đăng nhập thành công');
  }

  /**
   * API xác thực lại
   * @author : Tr4nLa4m (05-11-2022)
   * @param request request
   */
  @UseGuards(JwtAuthGuard)
  @Post('re-verify')
  async resendConfirmEmail(@Req() request: RequestWithUser) {
    await this.mailService.resendConfirmationEmail(request.user.id);
    return new CustomResponse(1, true, 'Gửi email xác nhận lại thành công');
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
  async logOut(@Req() request: RequestWithUser) {
    await this.userService.removeToken(request.user.id);
    request.res.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
    return new CustomResponse(null, true, 'Đăng xuất thành công');
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
  async authenticate(@Req() request: RequestWithUser) {
    const user = request.user;
    const res = Common.getLessEntityProperties(user, [
      'id',
      'name',
      'email',
      'avatar',
      'cover',
    ]);
    return res;
  }

  /**
   * API refresh access token
   * @author : Tr4nLa4m (5-11-2022)
   * @param request request
   * @returns
   */
  // @UseGuards(JwtRefreshGuard)
  // @Get('refresh')
  // async refresh(@Req() request: RequestWithUser) {
  //   const accessTokenCookie = this.authService.getCookieAccessToken(
  //     request.user.id,
  //   );
  //   request.res.setHeader('Set-Cookie', accessTokenCookie);
  //   const res = Common.getLessEntityProperties(request.user, [
  //     'id',
  //     'name',
  //     'email',
  //     'avatar',
  //     'cover',
  //   ]);
  //   return res;
  // }

  /**
   * API quên mật khẩu
   * @author : Tr4nLa4m (15-11-2022)
   * @param forgotPasswordDto dto
   * @returns
   */
  @Post('forgot-password')
  async handleForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authService.checkEmailForgotPassword(
      forgotPasswordDto.forgotPasswordEmail,
    );
    await this.mailService.sendForgotPasswordEmail(user.email);
    return new CustomResponse(1, true, 'Đã gửi email chứa mã xác thực');
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
  async checkVerifyCode(
    @Req() request: RequestWithUser,
    @Body() verify: VerifyDto,
  ) {
    const res = await this.userService.checkVerifyCode(
      request.user.email,
      verify.verifyCode,
    );
    return res;
  }

  /**
   * API thực hiện xác nhận tài khoản 
   * @author : Tr4nLa4m (24-11-2022)
   * @param confirmEmailDto đối tượng truyền dữ liệu mã xác nhận
   * @returns 
   */
  @Post('confirm')
  async confirm(@Body() confirmEmailDto : ConfirmEmailDto) {
      const verifyCode = confirmEmailDto.verifyCode;
      var res = 0;
      res = await this.authService.verifyUserEmail(verifyCode, confirmEmailDto.email);
      return new CustomResponse(res, true, 'Xác nhận tài khoản thành công');
  }


  /**
   * API reset lại mật khẩu
   * @author : Tr4nLa4m (25-11-2022)
   * @param resetPasswordData 
   */
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordData: ResetPasswordEmailDto) {
      const verifyCode = resetPasswordData.verifyCode;
      let verifyObj = await this.authService.checkIsVerify(verifyCode, resetPasswordData.email);
      if(verifyObj.isValid){
        let res = await this.userService.setNewPassword(resetPasswordData.email, resetPasswordData.password);
        return res;
      }else {
        return new CustomResponse(0, false, 'Reset mật khẩu không thành công');
      }
  }
}
