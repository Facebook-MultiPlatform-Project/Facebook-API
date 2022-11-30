import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CreatePostDto } from '../dtos/create-post.dto';
import { POST_IMAGE_QUEUE, RESIZING_POST_IMAGE, NEW_SIZE_HEIGHT, NEW_SIZE_WIDTH } from '../post.constants';

@Injectable()
@Processor(POST_IMAGE_QUEUE)
export class PostImageProcessor {
  private logger = new Logger(PostImageProcessor.name);

  constructor() {}

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
   * Quy trình chỉnh size ảnh
   * @author : Tr4nLa4m (10-11-2022)
   * @param job job cần thực hiện
   */
  @Process(RESIZING_POST_IMAGE)
  public async resizePostImage(
    job: Job<{
      userId: number;
      createPostDto: CreatePostDto;
      file: Express.Multer.File;
    }>,
  ) {
    this.logger.log('Resizing and saving post image');

    const sharp = require('sharp');
    try {
      sharp(job.data.file.path)
        .resize({ width: NEW_SIZE_WIDTH, height: NEW_SIZE_HEIGHT })
        .toFile(`./uploads/post/images/${NEW_SIZE_WIDTH}x${NEW_SIZE_HEIGHT}/` + job.data.file.filename);
    } catch (error) {
      this.logger.error('Failed to resize and save post images');
    }
  }
}
