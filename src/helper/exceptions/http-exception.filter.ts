import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserValidateException } from './custom-exception';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseCode } from 'src/utils/response.code';

/**
 * Exception filter bắt mọi thứ exception
 * @author : Tr4nLa4m (17-11-2022)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter   {
  // Inject HttpAdapterHost
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Xử lý khi bắt được exception
   * @author : Tr4nLa4m (17-10-2022)
   * @param exception exception bắt được
   * @param host host
   */
  catch(exception: unknown, host: ArgumentsHost) {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const code =
      exception instanceof UserValidateException
        ? exception.code
        : ResponseCode.EXCEPTION_ERROR.Code;
    const message =
      exception instanceof HttpException
        ? exception.message
        : ResponseCode.EXCEPTION_ERROR.Message_VN;

    const responseBody = {
      code,
      message,
      timestamp: new Date().toLocaleString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
