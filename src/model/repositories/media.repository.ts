import { Repository } from 'typeorm';
import MediaEntity from '../entities/media.entity';

export class MediaRepository extends Repository<MediaEntity> {}
