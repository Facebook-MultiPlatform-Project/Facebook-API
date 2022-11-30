import { Repository } from "typeorm";
import FriendEntity from "../entities/friend.entity";

export class FriendRepository extends Repository<FriendEntity> {}