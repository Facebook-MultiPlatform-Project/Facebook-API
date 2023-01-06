import { memoryStorage } from 'multer';
import { HttpStatus } from '@nestjs/common';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';

/**
 * Options khi lưu file của middleware multer
 * @author : Tr4nLa4m (20-11-2022)
 */
export const postStorageOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: Math.pow(1024, 2) * 10,
  },
  fileFilter : (request : any, file : Express.Multer.File, callback : (error: Error, approve: boolean) => void) => {
    if (file.mimetype.includes('image')) {
      if(file.size > 4 * 1024 * 1024){
        callback(new UserValidateException(ResponseCode.FILE_TOO_BIG, HttpStatus.BAD_REQUEST), false)
      }
    }
    else if(file.mimetype == 'application/json'){
      file.mimetype = 'video/mp4';
    }
    else if (!(file.mimetype.includes('video'))){
      callback(new UserValidateException(ResponseCode.ONLY_IMAGES_VIDEOS, HttpStatus.BAD_REQUEST), false)
    }

    callback(null, true);
  }
};
