
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
    }
}