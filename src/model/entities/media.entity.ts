import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BaseEntity } from "typeorm";
import {PostEntity} from './post.entity'    

@Entity()
export class MediaEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string

    @ManyToOne(() => PostEntity, (post) => post.medias)
    post: PostEntity
}

export default MediaEntity;
