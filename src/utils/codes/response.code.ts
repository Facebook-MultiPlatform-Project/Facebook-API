
/**
 * Định nghĩa Các mã phản hồi
 * @author : Tr4nLa4m (16-11-2022)
 */
export const ResponseCode = {
    
    OK : {
        Code: 1000,
        Message_VN : "OK",
        Message_EN : "OK"
    },

    POST_NOT_EXIST : {
        Code: 9992,
        Message_VN : "Bài viết không tồn tại",
        Message_EN : "Post is not existed"
    },

    CODE_VERIFY_INCORRECT : {
        Code: 9993,
        Message_VN : "Mã xác thực không đúng",
        Message_EN : "Code verify is incorrect"
    },

    NO_DATA : {
        Code: 9994,
        Message_VN : "Không có dữ liệu hoặc không còn dữ liệu",
        Message_EN : "No data or end of list data"
    },

    USER_NOT_VALIDATED : {
        Code: 9995,
        Message_VN : "Không có người dùng này",
        Message_EN : "User is not validated"
    },

    USER_EXISTED : {
        Code: 9996,
        Message_VN : "Người dùng đã tồn tại",
        Message_EN : "User existed"
    },

    METHOD_INVALID : {
        Code: 9997,
        Message_VN : "Phương thức không đúng",
        Message_EN : "Method is invalid"
    },

    TOKEN_INVALID : {
        Code: 9998,
        Message_VN : "Sai token",
        Message_EN : "Token is invalid"
    },

    EXCEPTION_ERROR : {
        Code: 9999,
        Message_VN : "Lỗi exception",
        Message_EN : "Exception error"
    },

    CANNOT_CONNECT_DB : {
        Code: 1001,
        Message_VN : "Mất kết nối với database",
        Message_EN : "Cannot connect to database"
    },

    PARAMS_NOT_ENOUGHT : {
        Code: 1002,
        Message_VN : "Số lượng paramater không đủ",
        Message_EN : "Parameter is not enought"
    },

    PARAMS_TYPE_INVALID : {
        Code: 1003,
        Message_VN : "Kiểu tham số không hợp lệ",
        Message_EN : "Parameter type is invalid"
    },

    PARAMS_VALUE_INVALID : {
        Code: 1004,
        Message_VN : "Giá trị tham số không hợp lệ",
        Message_EN : "Parameter value is invalid"
    },

    UNKNOWN_ERROR : {
        Code: 1005,
        Message_VN : "Lỗi không xác định",
        Message_EN : "Unknown error"
    },

    FILE_TOO_BIG : {
        Code: 1006,
        Message_VN : "Lỗi exception",
        Message_EN : "Exception error"
    },

    UPLOAD_FILE_FAILED : {
        Code: 1007,
        Message_VN : "Upload file thất bại",
        Message_EN : "Upload file failed"
    },

    MAX_NUMBER_IMAGES : {
        Code: 1008,
        Message_VN : "Số lượng ảnh vượt mức quy định",
        Message_EN : "Maximum number of images"
    },

    ONLY_IMAGES_VIDEOS : {
        Code: 1008,
        Message_VN : "Chỉ được phép upload ảnh hoặc video",
        Message_EN : "Maximum number of images"
    },

    NOT_ACCESS : {
        Code: 1009,
        Message_VN : "Không có quyền truy cập tài nguyên",
        Message_EN : "Not access"
    },

    ACTION_HAS_DONE: {
        Code: 1010,
        Message_VN : "Hành động đã được thực hiện trước đây bởi người dùng",
        Message_EN : "Action has been done previously by this user"
    },

    POST_NOT_PUBLISH: {
        Code: 1011,
        Message_VN : "Bài đăng vi phạm tiêu chuẩn cộng đồng",
        Message_EN : "Could not publish this post"
    },

    LIMIT_ACCESS: {
        Code: 1012,
        Message_VN : "Bài đăng bị giới hạn ở một số quốc gia",
        Message_EN : "Limit access"
    },


    CUSTOM : (message : string, code : number) => {
        return {
            Code: code,
            Message_VN : message,
            Message_EN : message
        }
    }
}