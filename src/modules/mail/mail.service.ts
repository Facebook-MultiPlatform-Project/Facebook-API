import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CONFIRM_REGISTRATION,
  MAIL_QUEUE,
  RESET_PASSWORD,
} from './mail.constants';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CommonMethods } from 'src/utils/common/common.function';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';

var Common = new CommonMethods();

/**
 * Service cho email
 * @author : Tr4nLa4m (20-11-2022)
 */
@Injectable()
export class MailService {
  //#region Fields
  private logger = new Logger(MailService.name);
  //#endregion

  //#region Constructor
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private mailQueue: Queue,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}
  //#endregion

  //#region Methods
  /**
   * Gửi email confirm
   * @author : Tr4nLa4m (01-11-2022)
   * @param email email
   */
  public async sendConfirmationEmail(email: string): Promise<void> {
    try {

      // Sinh mã 6 số ngẫu nhiên
      const verifyCode = Common.generateCode(6);

      const user = await this.userService.getUserByEmail(email);
      user.verifyCode = verifyCode;
      user.expiredDate = Common.addMinutesToDate(new Date(), 5);
      await this.userService.updateUser(user);
      await this.mailQueue.add(CONFIRM_REGISTRATION, {
        email,
        verifyCode
      });
    } catch (error) {
      this.logger.error(
        `Failed to send registration email to user ${email} to queue`,
      );
    }
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      });

      if (typeof payload === 'object' && 'verifyEmail' in payload) {
        return payload.verifyEmail;
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      } else {
        throw new BadRequestException('Bad token');
      }
    }
  }

  /**
   * Xác thực người dùng qua email
   * @author : Tr4nLa4m (25-11-2022)
   * @param verifyCode mã xác thực
   * @param email email
   * @returns 
   */
  public async verifyUserEmail(verifyCode: string, email : string) {
    const verifyObj = await this.checkIsVerify(verifyCode, email);
    if( !verifyObj.isValid){
      throw new BadRequestException(verifyObj.message);
    }
    let res = await this.userService.makeUserVerified(email);
    if(res === 0){
      throw new BadRequestException('Xác thực email thất bại');
    }
    return res;
  }

  /**
   * Kiểm tra xác thực 
   * @author : Tr4nLa4m (30-11-2022)
   * @param verifyCode mã xác thực
   * @param email email
   * @returns 
   */
  async checkIsVerify(verifyCode: string, email : string){
    let isValid = true;
    let msg = "";
    const user = await this.userService.getUserByEmail(email);

    if (user.isVerified) {
      msg = 'Email is already confirmed';
      isValid = false;
    }

    if(user.expiredDate.getTime() < new Date().getTime()){
      msg = ('Mã xác thực đã hết hạn');
      isValid = false;
    }

    if(user.verifyCode !== verifyCode){
      msg = ('Mã xác thực không chính xác');
      isValid = false;
    }

    return {
      isValid,
      message : msg
    }
  }

  /**
   * Thực hiện gửi lại mail xác nhận tài khoản
   * @author : Tr4nLa4m (05-11-2022)
   * @param id id người dùng
   */
  public async resendConfirmationEmail(id: string) {
    const user = await this.userService.getUserById(id);

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    await this.sendConfirmationEmail(user.email);
  }

  /**
   * Gửi email mã xác thực dành cho quên mật khẩu
   * @author : Tr4nLa4m (20-11-2022)
   * @param email email
   */
  public async sendForgotPasswordEmail(email: string): Promise<void> {
    try {
      // Sinh mã 6 số ngẫu nhiên
      const verifyCode = Common.generateCode(6);

      const user = await this.userService.getUserByEmail(email);
      user.verifyCode = verifyCode;
      user.expiredDate = Common.addMinutesToDate(new Date(), 5);
      await this.userService.updateUser(user);
      await this.mailQueue.add(RESET_PASSWORD, {
        email,
        verifyCode
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to user ${email} to queue`,
      );
    }
  }

  async decodeResetPasswordToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_PASSWORD_TOKEN_SECRET'),
      });

      if (typeof payload === 'object' && 'resetPasswordEmail' in payload) {
        return payload.resetPasswordEmail;
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset password token expired');
      } else {
        throw new BadRequestException('Bad token');
      }
    }
  }

  //#endregion
}
