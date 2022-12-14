import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectQueue } from '@nestjs/bull';
import {
  AVATAR_QUEUE,
  DEFAULT_AVATAR,
  RESIZING_AVATAR,
  RESIZING_COVER,
} from './user.constants';
import { Queue } from 'bull';
import UpdateProfileDto from './dtos/update-profile.dto';
import { unlink } from 'fs';
import * as fs from 'fs';
import { UserValidateException } from 'src/helper/exceptions/custom-exception';
import { ResponseCode } from 'src/utils/codes/response.code';
import CustomResponse from 'src/helper/response/response.type';
import BlockUserEntity from 'src/model/entities/block-user.entity';
import { BlockUserRepository } from 'src/model/repositories/block-user.repository';
import { BlockType } from './enum/block-type.enum';

/**
 * Service dành cho người dùng
 * @author : Tr4nLa4m (01-11-2022)
 */
@Injectable()
export class UserService {
  //#region Fields
  private logger = new Logger(UserService.name);
  //#endregion

  //#region Constructor
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: UserRepository,
    @InjectRepository(BlockUserEntity)
    private blockRepo: BlockUserRepository,
    @InjectQueue(AVATAR_QUEUE)
    private avatarQueue: Queue,
  ) {}
  //#endregion

  //#region Methods
  /**
   * Lấy người dùng bởi email
   * @author : Tr4nLa4m (11-11-2022)
   * @param email Email người dùng
   * @returns
   */
  async getUserByEmail(email: string) {
    const user = await this.userRepo.findOneBy({ email });

    if (user) {
      return user;
    }

    throw new UserValidateException(
      ResponseCode.USER_NOT_VALIDATED,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Thực hiện lấy người dùng thông qua Id
   * @author : Tr4nLa4m (16-10-2022)
   * @param id Id của người dùng
   * @returns {Promise} trả về 1 promise
   */
  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOneBy({ id });

    if (user) {
      return user;
    }

    throw new UserValidateException(
      ResponseCode.USER_NOT_VALIDATED,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Thực hiện thêm mới người dùng
   * @author : Tr4nLa4m (10-11-2022)
   * @param createUserDto đối tượng dữ liệu dto
   * @returns
   */
  async createUser(createUserDto: CreateUserDto) {
    const newUser = this.userRepo.create(createUserDto);

    const res = await this.userRepo.save(newUser);

    return res;
  }

  /**
   * Cập nhật người dùng
   * @author : Tr4nLa4m (20-11-2022)
   * @param user người dùng
   * @returns
   */
  async updateUser(user: UserEntity) {
    delete user.email;
    delete user.refreshToken;
    delete user.password;

    const res = await this.userRepo.save(user);
    return res;
  }

  /**
   * Verify tài khoản người dùng
   * @author : Tr4nLa4m (30-11-2022)
   * @param email email
   * @returns
   */
  async makeUserVerified(email: string) {
    const res = await this.userRepo.update({ email }, { isVerified: true });
    return res.affected;
  }

  /**
   * Đặt lại refresh token
   * @author : Tr4nLa4m (10-11-2022)
   * @param currentToken token
   * @param id Id người dùng
   */
  async setRefreshToken(currentToken: string, id: string) {
    try {
      const refreshToken = await bcrypt.hash(currentToken, 10);
      await this.userRepo.update(id, { refreshToken });
    } catch (error) {
      throw new HttpException(
        { cause: new Error(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy người dùng nếu Refresh token còn hạn
   * @author : Tr4nLa4m (10-11-2022)
   * @param refreshToken Refresh token
   * @param id Id người dùng
   * @returns
   */
  async getUserIfRefreshTokenValid(refreshToken: string, id: string) {
    try {
      // Lấy người dùng thông qua Id
      const user = await this.getUserById(id);

      const checkRefreshToken = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (checkRefreshToken) {
        return user;
      }
    } catch (error) {
      throw new HttpException(
        { cause: new Error(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeRefreshToken(id: string) {
    return this.userRepo.update(id, {
      refreshToken: null,
    });
  }

  /**
   * Cập nhật ảnh avatar
   * @author : Tr4nLa4m (10-11-2022)
   * @param id id người dùng
   * @param file file ảnh
   */
  async addAvatarToQueue(id: string, file: Express.Multer.File) {
    try {
      this.avatarQueue.add(RESIZING_AVATAR, {
        id,
        file,
      });
    } catch (error) {
      this.logger.error(`Failed to send avatar ${file} to queue`);
    }
  }

  /**
   * Cập nhật ảnh nền
   * @author : Tr4nLa4m (10-11-2022)
   * @param id id người dùng
   * @param file file ảnh
   */
  async addCoverToQueue(id: string, file: Express.Multer.File) {
    try {
      this.avatarQueue.add(RESIZING_COVER, {
        id,
        file,
      });
    } catch (error) {
      this.logger.error(`Failed to send cover ${file} to queue`);
    }
  }

  async deleteAvatar(userId: string) {
    const user = await this.getUserById(userId);

    if (user.avatar != DEFAULT_AVATAR) {
      fs.unlink('./uploads/avatars/40x40/' + user.avatar, (err) => {
        if (err) {
          console.error(err);
          return err;
        }
      });

      fs.unlink('./uploads/avatars/70x70/' + user.avatar, (err) => {
        if (err) {
          console.error(err);
          return err;
        }
      });

      fs.unlink('./uploads/avatars/original/' + user.avatar, (err) => {
        if (err) {
          console.error(err);
          return err;
        }
      });

      user.avatar = DEFAULT_AVATAR;
    }

    delete user.email;
    delete user.password;
    delete user.refreshToken;

    return this.userRepo.save(user);
  }

  /**
   * Thực hiện cập nhật thông tin người dùng
   * @author : Tr4nLa4m (16-11-2022)
   * @param userId Id của người dùng
   * @param userData Dữ liệu người dùng
   * @returns {Promise} trả về một promise
   */
  async updateProfile(
    userId: string,
    userData: UpdateProfileDto,
  ): Promise<any> {
    let toUpdate = await this.getUserById(userId);

    delete toUpdate.password;
    delete toUpdate.refreshToken;
    delete toUpdate.email;

    let updated = Object.assign(toUpdate, userData);
    return await this.userRepo.save(updated);
  }

  /**
   * Set mật khẩu mới
   * @author : Tr4nLa4m (30-11-2022)
   * @param email email
   * @param password password mới
   */
  async setNewPassword(email: string, password: string) {
    const user = await this.getUserByEmail(email);

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepo.update(user.id, {
      password: hashedPassword,
    });
  }

  /**
   * Kiểm tra mã xác thực
   * @author : Tr4nLa4m (20-11-2022)
   * @param email email
   * @param verifyCode mã xác thực
   * @returns
   */
  async checkVerifyCode(email: string, verifyCode: string) {
    const user = await this.getUserByEmail(email);
    let isValid = true;
    let msg = '';

    if (user.expiredDate.getTime() < new Date().getTime()) {
      msg = 'Mã xác thực đã hết hạn';
      isValid = false;
    }

    if (user.verifyCode !== verifyCode) {
      msg = 'Mã xác thực không chính xác';
      isValid = false;
    }

    return new CustomResponse(isValid, isValid, msg);
  }

  /**
   * Lấy danh sách bị  người dùng chặn
   * @author : Tr4nLa4m (20-11-2022)
   * @param user user
   */
  async getBlockList(user: UserEntity) {
    const blockeds = await this.blockRepo
      .createQueryBuilder('block')
      .select('blocked.id', 'id')
      .addSelect('blocked.name', 'name')
      .addSelect('blocked.avatar', 'avatar')
      .innerJoin(UserEntity, 'blocked', 'block.blockedId = blocked.id')
      .where('block.blockerId = :id', { id: user.id })
      .getRawMany();
    return blockeds;    
  }


async setBlock(user : UserEntity, blockedId : string, type : BlockType){
  if(user.id === blockedId){
    throw new UserValidateException(ResponseCode.CUSTOM("Không thể chặn chính mình", 1004), HttpStatus.BAD_REQUEST);
  }

  const blocked = await this.getUserById(blockedId);
  if(!blocked){
    throw new UserValidateException(ResponseCode.USER_EXISTED, HttpStatus.BAD_REQUEST);
  }

  const userWithBlockeds = await this.userRepo.findOne({
    where : {
      id : user.id
    },
    relations : {
      blockeds : true
    }
  });
  const blockList = userWithBlockeds.blockeds.map((blockUser) => {
    return blockUser.blocked.id;
  });
  if(type === BlockType.BLOCK){
    if(!blockList.includes(blocked.id)){
      userWithBlockeds.blockeds.push(this.blockRepo.create({
        blocked : blocked,
        blocker : user
      }))
    }
    else{
      this.logger.warn('setBlock', "Người bị chặn đã tồn tại trong danh sách")
    }
  }else if(type === BlockType.UNBLOCK){
    const index = blockList.indexOf(blocked.id);
    if(index > -1){
      userWithBlockeds.blockeds.splice(index, 1);
    }
  }
  const res = await this.userRepo.save(userWithBlockeds);
  return new CustomResponse(res, true, "OK");
}

  //#endregion
}
