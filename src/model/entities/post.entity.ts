import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import CommentEntity from './comment.entity';
import EmotionEntity from './emotion.entity';
import MediaEntity from './media.entity';
import UserEntity from './user.entity';

/**
 * Entity bài viết
 * @author : Tr4nLa4m (12-11-2022)
 */
@Entity()
export class PostEntity extends BaseEntity {

  //#region Constructor
  constructor(partial: Partial<PostEntity>) {
    super()
    Object.assign(this, partial);
  }

  // Id bài viết
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ID chủ bài viết
  @ManyToOne(() => UserEntity, (userEntity) => userEntity.posts)
  author: UserEntity;

  // Ngày tạo
  @CreateDateColumn({})
  createdAt: Date;

  // Ngày chỉnh sửa
  @Column()
  modifiedDate: Date;

  // Nội dung
  @Column()
  content: string;

  // Trạng thái cảm xúc kèm bài đăng
  @Column({default : null})
  status: string;

  // Trạng thái bài viết đang bị khoá comment
  @Column({default : false})
  isBlockComment : boolean;

  // Trạng thái bài viết đang bị khoá 
  @Column({default : false})
  isBanned : boolean;

  // Số comment
  @Column({default : 0})
  numComments: number;

  // Số lượt thích
  @Column({default : 0})
  numLikes: number;

  @OneToMany(() => MediaEntity, (media) => media.post)
  medias: MediaEntity[];

  // Danh sách ID người thích bài viết
  @OneToMany(() => EmotionEntity, (likes) => likes.post )
  likes: EmotionEntity[];

  // Danh sách Comment
  @OneToMany(() => CommentEntity, (comment) => comment.post )
  comments: CommentEntity[];
}

export default PostEntity;
