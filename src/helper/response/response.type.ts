import { ResponseCode } from 'src/utils/codes/response.code';

/**
 * Lớp custom response
 * @author : Tr4nLa4m (20-11-2022)
 */
export default class CustomResponse {
  code: number;

  success: boolean;

  message: string;

  data: any;

  constructor(
    data: any = null,
    success: boolean = true,
    message: string = ResponseCode.OK.Message_VN,
    code: number = ResponseCode.OK.Code,
  ) {
    this.code = code;
    this.success = success;
    this.message = message;
    this.data = data;
  }
}
