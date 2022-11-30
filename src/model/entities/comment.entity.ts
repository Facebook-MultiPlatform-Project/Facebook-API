import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
import PostEntity from './post.entity';
  import UserEntity from './user.entity';
  
  /**
   * Entity bình luận
   * @author : Tr4nLa4m (12-11-2022)
   */
  @Entity()
  export class CommentEntity extends BaseEntity {
    // Id bài viết
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    // ID chủ bài viết
    @ManyToOne(() => UserEntity)
    user: UserEntity;

    // ID chủ bài viết
    @ManyToOne(() => PostEntity, (post) => post.comments )
    post: PostEntity;
  
    // Ngày tạo
    @CreateDateColumn({})
    createdAt: Date;
  
    // Ngày chỉnh sửa
    @Column()
    modifiedDate: Date;
  
    // Nội dung
    @Column()
    content: string;
  
  }
  
  export default CommentEntity;
  