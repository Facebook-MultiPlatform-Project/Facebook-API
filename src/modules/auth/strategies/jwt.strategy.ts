import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';
import { Request } from 'express';
import TokenPayload from '../interfaces/token-payload.interface';
import { ResponseCode } from 'src/utils/codes/response.code';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';

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
   * Xác thực người dùng qua access token
   * @author : Tr4nLa4m (16-10-2022)
   * @param payload payload
   * @returns {Promise}
   */
  async validate(payload: TokenPayload): Promise<any> {
    try {
      return this.userService.getUserById(payload.id);
    } catch (error) {
      if(error.message === ResponseCode.USER_NOT_VALIDATED.Message_VN){
        throw new UserValidateException(ResponseCode.TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
      }else{
        throw error;
      }

    }
  }
}
