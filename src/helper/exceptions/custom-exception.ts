import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from 'src/utils/response.code';

/**
 * Lớp custom exception
 * @author : Tr4nLa4m (17-10-2022)
 */
export class UserValidateException extends HttpException {
  // Mã code định nghĩa
  code: number;

  //#region Constructor
  constructor(
    message: string = ResponseCode.EXCEPTION_ERROR.Message_VN,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code: number = ResponseCode.EXCEPTION_ERROR.Code,
  ) {
    super(message, statusCode);
    this.code = code;
  }
  //#endregion
}
