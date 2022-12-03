import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { BadRequestException } from '@nestjs/common';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';

export const avatarStorageOptions = {
  storage: diskStorage({
    destination: './uploads/avatars/original/',
    filename: (request, file, callback) => {
      
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;

      callback(null, `${filename}${extension}`);
    },
  }),
  limits: {
    fileSize: Math.pow(1024, 2) * 4,
  },

  fileFilter : (request : any, file : Express.Multer.File, callback : (error: Error, approve: boolean) => void) => {
    if (!file.mimetype.includes('image')) {
      return callback(
        new UserValidateException(ResponseCode.CUSTOM("Chỉ được upload file ảnh", 1007)),
        null,
      );
    }

    callback(null, true);
  }
};
