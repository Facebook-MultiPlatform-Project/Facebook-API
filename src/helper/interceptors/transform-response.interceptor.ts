import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCode } from 'src/utils/codes/response.code';
import CustomResponse from '../response/response.type';

/**
 * Custom Response
 * @author : Tr4nLa4m (17-11-2022)
 */
export interface Response<T> {
  data: T;
  code: number;
  message: string;
  success : boolean;
}

/**
 * Interceptor biến đổi response
 * @author : Tr4nLa4m (17-11-2022)
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next
      .handle()
      .pipe(
        map((rawData) => {
          let code = ResponseCode.OK.Code;
          let message = ResponseCode.OK.Message_VN;
          let success = true;
          let data = rawData;
          if(rawData instanceof CustomResponse ){
            code = rawData.code;
            message = rawData.message;
            success = rawData.success;
            data = rawData.data;
          }
          return {
            code,
            message,
            success,
            data
          }
        }),
      );
  }
}
