import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import * as fs from 'fs';
import UserEntity from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
import {
  AVATAR_QUEUE,
  DEFAULT_AVATAR,
  RESIZING_AVATAR,
  RESIZING_COVER,
} from '../user.constants';
import { UserService } from '../user.service';

@Injectable()
@Processor(AVATAR_QUEUE)
export class AvatarProcessor {
  private logger = new Logger(AvatarProcessor.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: UserRepository,
    private userService: UserService,
  ) {}

  @OnQueueActive()
  public onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  public onComplete(job: Job) {
    this.logger.debug(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  public onError(job: Job<any>, error: any) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Quy trình xử lý ảnh đại diện (resize và lưu ảnh)
   * @author : Tr4nLa4m (12-11-2022)
   * @param job job
   */
  @Process(RESIZING_AVATAR)
  public async resizeAvatar(
    job: Job<{ id: string; file: Express.Multer.File }>,
  ) {
    this.logger.log('Resizing and saving avatar');

    const sharp = require('sharp');

    try {
      const user = await this.userService.getUserById(job.data.id);

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
      }

      await this.userRepo.update(job.data.id, {
        avatar: job.data.file.filename,
      });

      sharp(job.data.file.path)
        .resize(40, 40)
        .toFile('./uploads/avatars/40x40/' + job.data.file.filename);
      sharp(job.data.file.path)
        .resize(70, 70)
        .toFile('./uploads/avatars/70x70/' + job.data.file.filename);
    } catch (error) {
      this.logger.error('Failed to resize and save avatar');
    }
  }


  /**
   * Process xử lý ảnh nền (resize và lưu ảnh)
   * @author : Tr4nLa4m (13-11-2022)
   * @param job job
   */
  @Process(RESIZING_COVER)
  public async resizeCover(
    job: Job<{ id: string; file: Express.Multer.File }>,
  ) {
    this.logger.log('Resizing and saving cover');

    const sharp = require('sharp');

    try {
      const user = await this.userService.getUserById(job.data.id);

      if (user.avatar != DEFAULT_AVATAR) {

        fs.unlink('./uploads/covers/1080x600/' + user.avatar, (err) => {
          if (err) {
            console.error(err);
            return err;
          }
        });

        fs.unlink('./uploads/covers/original/' + user.avatar, (err) => {
          if (err) {
            console.error(err);
            return err;
          }
        });
      }

      await this.userRepo.update(job.data.id, {
        cover: job.data.file.filename,
      });

      sharp(job.data.file.path)
        .resize(1080, 600)
        .toFile('./uploads/covers/1080x600/' + job.data.file.filename);
    } catch (error) {
      this.logger.error('Failed to resize and save cover');
    }
  }
}
