import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';

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
    @ManyToOne(() => UserEntity, (userEntity) => userEntity.blockeds)
    blocker: UserEntity;
  
    // Id người bị chặn
    @ManyToOne(() => UserEntity, (userEntity) => userEntity.blockers)
    blocked : string;


}

export default BlockUserEntity;
