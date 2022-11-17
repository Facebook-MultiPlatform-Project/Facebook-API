import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
} from 'typeorm';
import UserEntity1 from './user.entity';

/**
 * Entity người chặn
 * @author : Tr4nLa4m (16-11-2022)
 */
@Entity()
export class BlockUserEntity extends BaseEntity {

    // Id của bản ghi
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    // Id người chặn
    @ManyToOne(() => UserEntity1, (userEntity) => userEntity.blockedIds)
    blocker: UserEntity1;
  
    // Id người bị chặn
    @Column({type : 'uuid', nullable : false})
    blockedId : string;


}

export default BlockUserEntity;
