import { HttpException, HttpStatus } from "@nestjs/common";


export class UserValidateException extends HttpException {



    constructor(message : string, statusCode : HttpStatus) {
      super(message, statusCode);
    }
  }