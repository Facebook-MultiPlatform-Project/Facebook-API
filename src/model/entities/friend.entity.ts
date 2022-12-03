import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FriendStatus } from '../../modules/friend/enum/friend.enum';
import UserEntity from './user.entity';

/**
 * Entity bạn bè
 * @author : Tr4nLa4m (12-11-2022)
 */
@Entity()
export class FriendEntity extends BaseEntity {


  // Id bản ghi
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ID người gửi yêu cầu
  @ManyToOne(() => UserEntity)
  sender: UserEntity;

  // ID người nhận yêu cầu
  @ManyToOne(() => UserEntity)
  receiver: UserEntity;

  // Trạng thái
  @Column({
    type: 'enum',
    enum: FriendStatus,
    default: FriendStatus.SEND_REQ,
  })
  status: FriendStatus;

  // Ngày tạo
  @CreateDateColumn({})
  createdAt: Date;

}

export default FriendEntity;
