import { memoryStorage } from 'multer';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';

export const imageStorageOption = {
  // sử dụng memory storage
  storage: memoryStorage(),
  // tối đa 4 Mb
  limits: {
    fileSize: Math.pow(1024, 2) * 4,
  },
  // lọc những file khác file ảnh
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
