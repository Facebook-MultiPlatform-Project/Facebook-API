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
} from './user.constants';
import { Queue } from 'bull';
import UpdateProfileDto from './dtos/update-profile.dto';
import { unlink } from 'fs';
import * as fs from 'fs';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: UserRepository,
    @InjectQueue(AVATAR_QUEUE)
    private avatarQueue: Queue,
  ) {}

  async getUserByEmail(email: string) {
    const user = await this.userRepo.findOneBy({ email });

    if (user) {
      return user;
    }

    throw new HttpException(
      'No user with this email has been found',
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Thực hiện lấy người dùng thông qua Id
   * @author : Tr4nLa4m (16-10-2022)
   * @param id Id của người dùng
   * @returns {Promise} trả về 1 promise
   */
  async getUserById(id: string) {
    const user = await this.userRepo.findOneBy({ id });

    if (user) {
      return user;
    }

    throw new HttpException(
      'No user with this ID has been found',
      HttpStatus.NOT_FOUND,
    );
  }

  async createUser(createUserDto: CreateUserDto) {
    const newUser = new UserEntity();
    newUser.email = createUserDto.email;
    newUser.password = createUserDto.password;

    await this.userRepo.save(newUser);

    return newUser;
  }

  async makeUserVerified(email: string) {
    await this.userRepo.update({ email }, { isVerified: true });
  }

  async setRefreshToken(currentToken: string, id: string) {
    const refreshToken = await bcrypt.hash(currentToken, 10);
    await this.userRepo.update(id, { refreshToken });
  }

  async getUserIfRefreshTokenValid(refreshToken: string, id: string) {
    try {
      const user = await this.getUserById(id);

      const checkRefreshToken = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (checkRefreshToken) {
        return user;
      }
    } catch (error) {
      throw new Error(error);
      
    }
  }

  async removeRefreshToken(id: string) {
    return this.userRepo.update(id, {
      refreshToken: null,
    });
  }

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
  async updateProfile(userId: string, userData: UpdateProfileDto) {
    let toUpdate = await this.getUserById(userId);

    delete toUpdate.password;
    delete toUpdate.refreshToken;
    delete toUpdate.email;

    let updated = Object.assign(toUpdate, userData);
    return await this.userRepo.save(updated);
  }

  async setNewPassword(email: string, password: string) {
    const user = await this.getUserByEmail(email);

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepo.update(user.id, {
      password: hashedPassword,
    });
  }
}
