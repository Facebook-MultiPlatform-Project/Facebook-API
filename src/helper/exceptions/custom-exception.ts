import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from 'src/utils/codes/response.code';

type ErrorObject = {
  Message_VN?: string;
  Message_EN?: string;
  Code?: number;
};

/**
 * Lớp custom exception
 * @author : Tr4nLa4m (17-10-2022)
 */
export class UserValidateException extends HttpException {
  // Mã code định nghĩa
  code: number;

  //#region Constructor
  constructor(
    errorObject: ErrorObject = ResponseCode.EXCEPTION_ERROR,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(errorObject.Message_VN, statusCode);
    this.code = errorObject.Code;
  }
  //#endregion
}

