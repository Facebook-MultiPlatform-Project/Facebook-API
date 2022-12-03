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
   * Entity biểu cảm
   * @author : Tr4nLa4m (18-11-2022)
   */
  @Entity()
  export class EmotionEntity extends BaseEntity {
    // Id bản ghi
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    // ID người thích
    @ManyToOne(() => UserEntity)
    user: UserEntity;

    
    // Id bài đăng
    @ManyToOne(() => PostEntity, (post) => post.likes)
    post: PostEntity;
  
    // Ngày tạo
    @CreateDateColumn({})
    createdAt: Date;
  
    // Ngày chỉnh sửa
    @Column()
    modifiedDate: Date;
    newLike: Promise<any>;
  
    
  }
  
  export default EmotionEntity;
  