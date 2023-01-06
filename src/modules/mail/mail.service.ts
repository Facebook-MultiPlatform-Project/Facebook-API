import {
  BadRequestException,
  HttpCode,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
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
import { RESEND_VERIFY_CODE_PERIOD } from '../user/user.constants';

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
        verifyCode,
      });
    } catch (error) {
      this.logger.error(
        `[sendConfirmationEmail] - Failed to send registration email to user ${email} to queue`,
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
   * Thực hiện gửi lại mail xác nhận tài khoản
   * @author : Tr4nLa4m (05-11-2022)
   * @param id id người dùng
   */
  public async resendConfirmationEmail(id: string) {
    const user = await this.userService.getUserById(id);

    // Kiểm tra tài khoản đã được xác thực hay chưa
    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Kiểm tra thời gian tối thiểu để gửi lại mã xác thực
    if (user.expiredDate) {
      let now = new Date();
      let resendPeriod =
      now.getTime() - (user.expiredDate.getTime() - 5 * 60 * 1000 ) ;
      if (resendPeriod > 0 && resendPeriod < RESEND_VERIFY_CODE_PERIOD * 1000) {
        throw new UserValidateException(
          ResponseCode.ACTION_HAS_DONE,
          HttpStatus.BAD_REQUEST,
        );
      }
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
        verifyCode,
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
