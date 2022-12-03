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

    try {
      // Thực hiện băm mật khẩu thô
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Tạo người dùng mới
      const newUser = await this.userService.createUser({
        ...registerDto,
        password: hashedPassword,
      });

      delete newUser.isVerified;
      delete newUser.password;
      delete newUser.modifiedAt;
      delete newUser.refreshToken;

      return newUser;
      
    } catch (error) {
      if (error?.code == 'ER_DUP_ENTRY') {
        throw new UserValidateException(
          ResponseCode.USER_EXISTED,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(ResponseCode.EXCEPTION_ERROR.Message_VN, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  public async validateUserAndPassword(email: string, rawPassword: string) {
    const user = await this.userService.getUserByEmail(email);
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
      throw new UserValidateException( ResponseCode.USER_NOT_VALIDATED, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Tạo access token
   * @author : Tr4nLa4m (10-11-2022)
   * @param id Id của người dùng
   * @returns chuỗi access token
   */
  public getCookieAccessToken(id: string): string {
    const payload: TokenPayload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )}`;
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

  public getCookieForLogOut() {
    return [
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
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
