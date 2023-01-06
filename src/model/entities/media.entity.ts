import { MediaType } from 'src/modules/post/enum/media-type.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BaseEntity,
} from 'typeorm';
import { PostEntity } from './post.entity';

@Entity()
export class MediaEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Trạng thái
  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  type: MediaType;

  @ManyToOne(() => PostEntity, (post) => post.medias)
  post: PostEntity;
}

export default MediaEntity;
