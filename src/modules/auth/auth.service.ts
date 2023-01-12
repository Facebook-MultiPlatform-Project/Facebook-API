import {
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import RegisterDto from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import TokenPayload from './interfaces/token-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import JwtAuthGuard from './guards/jwt-auth.guard';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';
import { CommonMethods } from 'src/utils/common/common.function';
import AccessTokenData from './interfaces/access-token-data.interface';

const Common = new CommonMethods();

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Đăng ký người dùng mới
   * @author : Tr4nLa4m (10-11-2022)
   * @param registerDto Đối tượng dữ liệu cho đăng ký
   * @returns {Promise}
   */
  public async register(registerDto: RegisterDto): Promise<any> {

    // Kiểm tra người dùng đã tồn tại
    let existedUser = await this.userService.getUserByEmail(registerDto.email);
    if(existedUser){
      throw new UserValidateException(ResponseCode.USER_EXISTED, 400);
    }

    // Thực hiện băm mật khẩu thô
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Tạo người dùng mới
    const newUser = await this.userService.createUser({
      ...registerDto,
      password: hashedPassword,
    });

    const user = Common.getLessEntityProperties(newUser, [
      'id',
      'name',
      'email',
      'avatar',
      'cover',
    ]);

    return user;
  }

  /**
   * Validate người dùng bằng password
   * @author : Tr4nLa4m (11-11-2022)
   * @param email email
   * @param rawPassword mật khẩu raw
   * @returns
   */
  public async validateUserAndPassword(email: string, rawPassword: string) {
    const user = await this.userService.getUserByEmail(email);
    if(!user){
      throw new UserValidateException(ResponseCode.USER_EXISTED, HttpStatus.BAD_REQUEST);
    }
    await this.checkPassword(rawPassword, user.password);
    user.password = undefined;
    return user;
  }

  /**
   * Kiểm tra trùng mật khẩu
   * @author : Tr4nLa4m (11-11-2022)
   * @param rawPassword Password dạng gốc
   * @param hashedPassword Password đã băm
   */
  private async checkPassword(rawPassword: string, hashedPassword: string) {
    const isPasswordTrue = await bcrypt.compare(rawPassword, hashedPassword);

    if (!isPasswordTrue) {
      throw new UserValidateException(
        ResponseCode.USER_NOT_VALIDATED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Tạo access token
   * @author : Tr4nLa4m (10-11-2022)
   * @param id Id của người dùng
   * @returns chuỗi access token
   */
  public getCookieAccessToken(id: string): AccessTokenData {
    const payload: TokenPayload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    let accessTokenData : AccessTokenData = {
      accessToken : token,
      accessCookieToken : `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}`
    };

    return accessTokenData;
  }

  
  public getCookieAccessString(token : string) {

    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )}`
  }

  /**
   * Lấy refresh token
   * @author : Tr4nLa4m (10-11-2022)
   * @param id Id người dùng
   * @returns
   */
  public getCookieRefreshToken(id: string) {
    const payload: TokenPayload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    )}`;

    return { cookie, token };
  }

  /**
   * Xác thực người dùng qua email
   * @author : Tr4nLa4m (25-11-2022)
   * @param verifyCode mã xác thực
   * @param email email
   * @returns
   */
  public async verifyUserEmail(verifyCode: string, email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (user.isVerified) {
      throw new UserValidateException(ResponseCode.USER_CONFIRMED, HttpStatus.BAD_REQUEST);
    }

    const verifyObj = await this.checkIsVerify(verifyCode, email);
    if (!verifyObj.isValid) {
      throw new UserValidateException(ResponseCode.CUSTOM(verifyObj.message, 9999), HttpStatus.BAD_REQUEST);
    }
    

    let res = await this.userService.makeUserVerified(email);
    if (res === 0) {
      throw new UserValidateException(ResponseCode.CUSTOM('Xác thực email thất bại', 9999), HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return res;
  }

  /**
   * Kiểm tra mã xác thực
   * @author : Tr4nLa4m (30-11-2022)
   * @param verifyCode mã xác thực
   * @param email email
   * @returns
   */
  async checkIsVerify(verifyCode: string, email: string) {
    let isValid = true;
    let msg = '';
    const user = await this.userService.getUserByEmail(email);

    if (user.expiredDate.getTime() < new Date().getTime()) {
      msg = 'Mã xác thực đã hết hạn';
      isValid = false;
    }

    if (user.verifyCode !== verifyCode) {
      msg = 'Mã xác thực không chính xác';
      isValid = false;
    }

    return {
      isValid,
      message: msg,
    };
  }

  public getCookieForLogOut() {
    return [
      'Authentication=; HttpOnly; Path=/; Max-Age=0'
    ];
  }

  async checkEmailForgotPassword(email: string) {
    const user = this.userService.getUserByEmail(email);

    if (!user) {
      throw new HttpException(
        'No users have been registered with this email',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }
}
