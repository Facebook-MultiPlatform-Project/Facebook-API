import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';

/**
 * Options khi lưu file của middleware multer
 * @author : Tr4nLa4m (20-11-2022)
 */
export const postStorageOptions = {
  storage: diskStorage({
    destination: (request, file, callback) => {
      let des : string = './uploads/post/images/original/';
      if (file.fieldname == 'video'){
        des = './uploads/post/videos/original/';
      }

      callback(null, des);
    },
    filename: (request, file, callback) => {
      

      const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;

      callback(null, `${filename}${extension}`);
    },

  }),
  limits: {
    fileSize: Math.pow(1024, 2) * 10,
  },
  fileFilter : (request : any, file : Express.Multer.File, callback : (error: Error, approve: boolean) => void) => {
    if (file.mimetype.includes('image')) {
      if(file.size > 4 * 1024 * 1024){
        callback(new UserValidateException(ResponseCode.FILE_TOO_BIG, HttpStatus.BAD_REQUEST), false)
      }
    }
    else if (!(file.mimetype == 'application/json' || file.mimetype.includes('video'))){
      callback(new UserValidateException(ResponseCode.ONLY_IMAGES_VIDEOS, HttpStatus.BAD_REQUEST), false)
    }

    callback(null, true);
  }
};
