import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import UserEntity from 'src/model/entities/user.entity';
import { AuthService } from '../auth.service';

/**
 * Cơ chế xác thực local (sử dụng tài khoản và mật khẩu)
 * @author : Tr4nLa4m (16-11-2022)
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * Xác thực người dùng qua tên tài khoản và mật khẩu
   * @author : Tr4nLa4m (16-11-2022)
   * @param email Email của người dùng
   * @param password Mật khẩu của người dùng
   * @returns {Promise}
   */
  async validate(email: string, password: string): Promise<UserEntity> {
    return this.authService.validateUserAndPassword(email, password);
  }
}
