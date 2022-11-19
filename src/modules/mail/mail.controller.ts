import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import ResetPasswordEmailDto from './dtos/reset-password-email.dto';
import { MailService } from './mail.service';

@ApiTags('email')
@Controller('email')
export class MailController {
  constructor(
    private mailService: MailService,
    private userService: UserService,
  ) {}

  @Get('confirm')
  async confirm(@Query('token') token: string) {
    try {
      const email = await this.mailService.decodeConfirmationToken(token);
      var res = 0;
      res = await this.mailService.verifyUserEmail(email);
      return res;
    } catch (exception) {
      throw exception;
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordData: ResetPasswordEmailDto) {
    const email = await this.mailService.decodeResetPasswordToken(
      resetPasswordData.token,
    );

    if (email) {
      await this.userService.setNewPassword(email, resetPasswordData.password);
    }
  }
}
