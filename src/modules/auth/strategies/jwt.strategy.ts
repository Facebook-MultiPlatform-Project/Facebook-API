import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';
import { Request } from 'express';
import TokenPayload from '../interfaces/token-payload.interface';

/**
 * Cơ chế xác thực Jwt
 * @author : Tr4nLa4m (16-10-2022)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  /**
   * Xác thực người dùng qua acess token
   * @author : Tr4nLa4m (16-10-2022)
   * @param payload payload
   * @returns {Promise}
   */
  async validate(payload: TokenPayload): Promise<any> {
    return this.userService.getUserById(payload.id);
  }
}
