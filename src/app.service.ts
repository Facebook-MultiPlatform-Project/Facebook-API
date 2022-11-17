/**
 * File chứa các service cung cấp logic nghiệp vụ
 * @author : ??? ( - - )
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
