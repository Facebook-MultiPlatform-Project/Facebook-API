import { Exclude } from 'class-transformer';
import { DEFAULT_AVATAR, DEFAULT_COVER } from 'src/modules/user/user.constants';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import BlockUserEntity from './block-user.entity';
import PostEntity from './post.entity';

/**
 * Entity người dùng
 * @author : Tr4nLa4m (16-11-2022)
 */
@Entity()
export class UserEntity extends BaseEntity {

  //#region Constructor
  constructor(partial: Partial<UserEntity>) {
    super()
    Object.assign(this, partial);
  }
  //#endregion

  //#region Fields
  // ID người dùng
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Tên người dùng
  @Column({
    default: null,
  })
  name: string;

  // Mật khẩu tài khoản -- hash
  @Column({})
  @Exclude() // Thực hiện loại bỏ khỏi response khi trả về dữ liệu
  password: string;

  // Email tài khoản
  @Column({
    unique: true,
  })
  email: string;

  // Email tài khoản
  @Column({
    default : null
  })
  uuid: string;

  // Link avata tài khoản
  @Column({
    default: DEFAULT_AVATAR,
  })
  avatar: string;

  // Link nền tài khoản
  @Column({
    default: DEFAULT_COVER,
  })
  cover: string;

  // Ngày sinh
  @Column('date', {default : null})
  birthday: Date;

  // Giới tính - 1 là nam, 0 là nữ, 2 là other
  @Column({ type: 'smallint', default : null })
  gender: number;

  // Đã xác thực
  @Column({ default: false })
  isVerified: boolean;

  // Code để verify
  @Column({default : null})
  verifyCode : string;

  // Thời hạn hết hiệu lực của mã xác thực
  @Column({default : null})
  expiredDate: Date;

  // Token
  @Column({
    nullable: true,
  })
  @Exclude()
  token: string;

  // Ngày tạo
  @CreateDateColumn({})
  createdAt: Date;

  // Ngày sửa tài khoản
  @Column({default : null})
  modifiedAt: Date;

  // Danh sách ID người bị chặn bởi user hiện tại
  @OneToMany(() => BlockUserEntity, (block_user) => block_user.blocker  )
  blockeds: BlockUserEntity[];

  // Danh sách ID người chặn user hiện tại
  @OneToMany(() => BlockUserEntity, (block_user) => block_user.blocked  )
  blockers: BlockUserEntity[];

  // Danh sách bài đăng
  @OneToMany(() => PostEntity, (postEntity) => postEntity.author)
  posts: PostEntity[];

  //#endregion
}

export default UserEntity;
