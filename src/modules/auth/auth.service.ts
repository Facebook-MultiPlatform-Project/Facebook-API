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
import { ResponseCode } from 'src/utils/response.code';

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

      return newUser;
      
    } catch (error) {
      if (error?.code == 'ER_DUP_ENTRY') {
        throw new UserValidateException(
          ResponseCode.USER_EXISTED.Message_VN,
          HttpStatus.BAD_REQUEST,
          ResponseCode.USER_EXISTED.Code
        );
      }

      throw new HttpException('Có lỗi xảy ra', HttpStatus.INTERNAL_SERVER_ERROR,
      { cause : new Error(error)});
    }
  }


  public async validateUserAndPassword(email: string, rawPassword: string) {
    const user = await this.userService.getUserByEmail(email);
    await this.checkPassword(rawPassword, user.password);
    user.password = undefined;
    return user;
  }

  private async checkPassword(rawPassword: string, hashedPassword: string) {
    const isPasswordTrue = await bcrypt.compare(rawPassword, hashedPassword);

    if (!isPasswordTrue) {
      throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
    }
  }

  public getCookieAccessToken(id: string) {
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
