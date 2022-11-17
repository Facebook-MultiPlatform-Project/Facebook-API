import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCode } from 'src/utils/response.code';

/**
 * Custom Response
 * @author : Tr4nLa4m (17-11-2022)
 */
export interface Response<T> {
  data: T;
  code: number;
  message: string;
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
        map(({ code, message, ...data }) => ({
          data: data,
          code: code ?? ResponseCode.OK.Code,
          message: message ?? ResponseCode.OK.Message_VN,
        })),
      );
  }
}
