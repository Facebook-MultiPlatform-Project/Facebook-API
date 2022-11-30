import { HttpCode, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import CustomResponse from 'src/helper/response/response.type';
import FriendEntity from 'src/model/entities/friend.entity';
import UserEntity from 'src/model/entities/user.entity';
import { FriendStatus } from 'src/modules/friend/enum/friend.enum';
import { FriendRepository } from 'src/model/repositories/friend.repository';
import { ResponseCode } from 'src/utils/codes/response.code';
import { TypeUserFriend } from './enum/type-user-friend.enum';

@Injectable()
export class FriendService {
  private logger = new Logger(FriendService.name);

  //#region Constructor
  constructor(
    @InjectRepository(FriendEntity)
    private friendRepo: FriendRepository,
  ) {}

  //#endregion

  /**
   * Lấy danh sách yêu cầu kết bạn của người dùng
   * @author : Tr4nLa4m (22-11-2022)
   * @param user người dùng
   * @returns
   */
  async getRequests(user: UserEntity) {
    const res = await this.friendRepo
      .createQueryBuilder('friend')
      .select('friend.createdAt', 'createAt')
      .addSelect('sender.id', 'id')
      .addSelect('sender.name', 'name')
      .addSelect('sender.avatar', 'avatar')
      .leftJoin(UserEntity, 'sender', 'friend.senderId = sender.id')
      .where('friend.receiverId = :receiverId', { receiverId: user.id })
      .andWhere('friend.status = :status', { status: FriendStatus.SEND_REQ })
      .orderBy('friend.createdAt', 'DESC')
      .getRawMany();
    return new CustomResponse(res, true, 'Danh sách yêu cầu kết bạn ');
  }

  /**
   * Thực hiện gửi yêu cầu kết bạn
   * @author : Tr4nLa4m (25-11-2022)
   * @param sender  người gửi
   * @param receiver  người nhận
   */
  async setRequest(sender: UserEntity, receiver: UserEntity) {
    let checkBack = await this.findRequest(receiver.id, sender.id, [
      FriendStatus.SEND_REQ,
      FriendStatus.ACCEPTED,
    ]);
    if (checkBack) {
      return new CustomResponse(
        [],
        false,
        'Đối phương đã gửi lời mời kết bạn hoặc đã là bạn',
      );
    }

    let isFriend = await this.findRequest(sender.id, receiver.id);
    if (isFriend) {
      let msg = '';
      if (isFriend.status == FriendStatus.ACCEPTED) {
        msg = 'Đối phương đã là bạn';
      } else if (isFriend.status == FriendStatus.SEND_REQ) {
        msg = 'Bạn đã gửi yêu cầu kết bạn';
      }
      if (
        isFriend.status == FriendStatus.ACCEPTED ||
        isFriend.status == FriendStatus.SEND_REQ
      ) {
        return new CustomResponse([], false, msg);
      }

      isFriend.status = FriendStatus.SEND_REQ;
      let res = await this.friendRepo.save(isFriend);
      if (res) {
        return new CustomResponse(1, true, 'Gửi yêu cầu kết bạn thành công');
      }
    } else {
      const res = await this.createRequest(sender, receiver);
      if (res) {
        return new CustomResponse(1, true, 'Gửi yêu cầu kết bạn thành công');
      }
    }
  }

  /**
   * Thực hiện xử lý yêu cầu kết bạn
   * @author : Tr4nLa4m (20-11-2022)
   * @param sender Người gửi yêu cầu
   * @param receiver Người nhận yêu cầu
   * @param isAccept Trạng thái accept
   * @returns
   */
  async setAccept(sender: UserEntity, receiver: UserEntity, isAccept: boolean) {
    let friendReq = await this.findRequest(sender.id, receiver.id);
    if (!friendReq) {
      throw new UserValidateException(
        ResponseCode.NO_DATA,
        HttpStatus.NOT_FOUND,
      );
    }

    if (friendReq.status !== FriendStatus.SEND_REQ) {
      return new CustomResponse(
        null,
        false,
        'Đã là bạn hoặc chưa gửi yêu cầu kết bạn',
      );
    }

    let msg = 'Kết bạn thành công !';
    if (!isAccept) {
      friendReq.status = FriendStatus.REFUSED;
      msg = 'Từ chối kết bạn thành công !';
    } else {
      friendReq.status = FriendStatus.ACCEPTED;
    }

    const res = await this.friendRepo.save(friendReq);
    if (res) {
      return new CustomResponse(1, true, msg);
    } else {
      return new CustomResponse(
        null,
        false,
        ResponseCode.UNKNOWN_ERROR.Message_VN,
      );
    }
  }

  /**
   * Thực hiện xoá bạn
   * @author : Tr4nLa4m (20-11-2022)
   * @param user người dùng
   * @param friend người bạn
   * @returns
   */
  async setRemove(user: UserEntity, friend: UserEntity) {
    let friendReq1 = await this.findRequest(user.id, friend.id, [1]);
    let friendReq2 = await this.findRequest(friend.id, user.id, ['1']);

    let friendReq = friendReq1 ? friendReq1 : friendReq2;
    if (!friendReq) {
      throw new UserValidateException(
        ResponseCode.NO_DATA,
        HttpStatus.NOT_FOUND,
      );
    }

    friendReq.status = FriendStatus.CANCEL;

    let res = await this.friendRepo.save(friendReq);
    if (res) {
      return new CustomResponse(1, true, 'Xoá bạn thành công');
    } else {
      return new CustomResponse(
        null,
        false,
        ResponseCode.UNKNOWN_ERROR.Message_VN,
      );
    }
  }

  /**
   * Lấy danh sách bạn bè của người dùng
   * @author : Tr4nLa4m (24-11-2022)
   * @param user người dùng
   * @returns
   */
  async getFriends(user: UserEntity) {
    let requested = await this.findUsers(TypeUserFriend.RECEIVER, user.id, [FriendStatus.ACCEPTED]);
    let accepted = await this.findUsers(TypeUserFriend.SENDER, user.id, [FriendStatus.ACCEPTED]);

    const totalFriends = [...requested, ...accepted];
    const res = totalFriends.sort(function (firstFriend, secondFriend) {
      return (new Date(secondFriend.createdAt).getTime() - new Date(firstFriend.createdAt).getTime());
    })
    return new CustomResponse(res, true, 'Danh sách bạn bè');
  }

  /**
   * Huỷ lời mời kết bạn
   * @author : Tr4nLa4m (24-11-2022)
   * @param sender người gửi yêu cầu
   * @param receiver người nhận yêu cầu
   * @returns 
   */
  async cancelRequest(sender : UserEntity, receiver : UserEntity){
    const friendReq = await this.findRequest(sender.id, receiver.id);

    if(!friendReq){
      throw new UserValidateException(ResponseCode.NO_DATA, HttpStatus.NOT_FOUND);
    }

    if(friendReq.status !== FriendStatus.SEND_REQ){
      return new CustomResponse(null, false, "Đã là bạn hoặc chưa gửi yêu cầu");
    }

    friendReq.status = FriendStatus.CANCEL;
    const res = await this.friendRepo.save(friendReq);
    if(res){
      return new CustomResponse(1, true, "Đã huỷ lời mời kết bạn" )
    }
    return new CustomResponse(null, false, ResponseCode.UNKNOWN_ERROR.Message_VN, ResponseCode.UNKNOWN_ERROR.Code )
  }

  /**
   * Kiểm tra trạng thái bạn bè
   * @author : Tr4nLa4m (30-11-2022)
   * @param sender người gửi yêu cầu
   * @param receiver người nhận yêu cầu
   * @returns 
   */
  async getStatus(sender : UserEntity, receiver : UserEntity){
    const friendReq1 = await this.findRequest(sender.id, receiver.id);
    const friendReq2 = await this.findRequest(receiver.id, sender.id);
    const friendReq = friendReq1 ? friendReq1 : friendReq2;
    let isFriend = false;
    if(friendReq){
      if(friendReq.status === FriendStatus.ACCEPTED){
        isFriend = true;
      }
    }

    return new CustomResponse({
      isFriend ,
    }, true, isFriend ? "Đã là bạn" : "Chưa là bạn")

  }

  /************************* FUNCTION HELPER (WITH REPO)  ******************************/

  /**
   * Tìm một yêu cầu kết bạn
   * @author : Tr4nLa4m (20-11-2022)
   * @param senderId Id người gửi
   * @param receiverId Id người nhận
   * @param status Trạng thái nếu có
   * @returns
   */
  async findRequest(senderId: string, receiverId: string, status?: Array<any>) {
    if (status) {
      return await this.friendRepo
        .createQueryBuilder('friend')
        .where('friend.senderId = :senderId', { senderId: senderId })
        .andWhere('friend.receiverId = :receiverId', { receiverId: receiverId })
        .andWhere('friend.status IN (:...status)', {
          status: status,
        })
        .getOne();
    } else {
      return await this.friendRepo
        .createQueryBuilder('friend')
        .where('friend.senderId = :senderId', { senderId: senderId })
        .andWhere('friend.receiverId = :receiverId', { receiverId: receiverId })
        .getOne();
    }
  }

  /**
   * Tìm nhiều yêu cầu kết bạn
   * @author : Tr4nLa4m (25-11-2022)
   * @param senderId Id người gửi yêu cầu
   * @param receiverId Id người nhận yêu cầu
   * @param status Trạng thái nếu có
   * @returns
   */
  async findManyRequests(
    senderId?: string,
    receiverId?: string,
    status?: Array<any>,
  ) {
    if (senderId) {
      if (receiverId && status) {
        return await this.friendRepo
          .createQueryBuilder('friend')
          .where('friend.senderId = :senderId', { senderId: senderId })
          .andWhere('friend.receiverId = :receiverId', {
            receiverId: receiverId,
          })
          .andWhere('friend.status IN (:...status)', {
            status: status,
          })
          .getRawMany();
      } else {
        return await this.friendRepo
          .createQueryBuilder('friend')
          .where('friend.senderId = :senderId', { senderId: senderId })
          .andWhere('friend.status IN (:...status)', {
            status: status,
          })
          .getRawMany();
      }
    } else {
      return await this.friendRepo
        .createQueryBuilder('friend')
        .where('friend.receiverId = :receiverId', { receiverId: receiverId })
        .andWhere('friend.status IN (:...status)', {
          status: status,
        })
        .getRawMany();
    }
  }

  /**
   * Tìm người gửi yêu cầu hoặc người nhận yêu cầu
   * @author : Tr4nLa4m (24-11-2022)
   * @param type loại người (nhận hay gửi yêu cầu)
   * @param userId Id người dùng
   * @param status Trạng thái
   * @returns 
   */
  async findUsers(
    type: TypeUserFriend,
    userId: string,
    status?: Array<FriendStatus>,
  ) {
    switch (type) {
      case TypeUserFriend.SENDER:
        if (status) {
          return await this.friendRepo
            .createQueryBuilder('friend')
            .select('friend.createdAt', 'createdAt')
            .addSelect('sender.id', 'id')
            .addSelect('sender.name', 'name')
            .addSelect('sender.avatar', 'avatar')
            .leftJoin(UserEntity, 'sender', 'friend.senderId = sender.id')
            .where('friend.receiverId = :receiverId', { receiverId: userId })
            .andWhere('friend.status IN (:...status)', {
              status: status,
            })
            .orderBy('friend.createdAt', 'DESC')
            .getRawMany();
        } else {
          return await this.friendRepo
            .createQueryBuilder('friend')
            .select('friend.createdAt', 'createdAt')
            .addSelect('sender.id', 'id')
            .addSelect('sender.name', 'name')
            .addSelect('sender.avatar', 'avatar')
            .leftJoin(UserEntity, 'sender', 'friend.senderId = sender.id')
            .where('friend.receiverId = :receiverId', { receiverId: userId })
            .orderBy('friend.createdAt', 'DESC')
            .getRawMany();
        }
        break;

      case TypeUserFriend.RECEIVER:
        if (status) {
          return await this.friendRepo
            .createQueryBuilder('friend')
            .select('friend.createdAt', 'createdAt')
            .addSelect('receiver.id', 'id')
            .addSelect('receiver.name', 'name')
            .addSelect('receiver.avatar', 'avatar')
            .leftJoin(UserEntity, 'receiver', 'friend.receiverId = receiver.id')
            .where('friend.senderId = :senderId', { senderId: userId })
            .andWhere('friend.status IN (:...status)', {
              status: status,
            })
            .orderBy('friend.createdAt', 'DESC')
            .getRawMany();
        } else {
          return await this.friendRepo
            .createQueryBuilder('friend')
            .select('friend.createdAt', 'createdAt')
            .addSelect('receiver.id', 'id')
            .addSelect('receiver.name', 'name')
            .addSelect('receiver.avatar', 'avatar')
            .leftJoin(UserEntity, 'receiver', 'friend.receiverId = receiver.id')
            .where('friend.senderId = :senderId', { senderId: userId })
            .orderBy('friend.createdAt', 'DESC')
            .getRawMany();
        }
        break;

      default:
        break;
    }
  }

  /**
   * Tạo mới một yêu cầu
   * @author : Tr4nLa4m (20-11-2022)
   * @param sender người gửi yêu cầU
   * @param receiver người nhận yêu cầu
   * @returns
   */
  async createRequest(sender: UserEntity, receiver: UserEntity) {
    const friend = this.friendRepo.create({
      sender: sender,
      receiver: receiver,
      status: FriendStatus.SEND_REQ,
    });
    return await this.friendRepo.save(friend);
  }
}
