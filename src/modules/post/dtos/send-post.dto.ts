import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { type } from 'os';

/**
 * DTO gửi dữ liệu bài đăng
 * @author : Tr4nLa4m (20-11-2022)
 */
export type SendPostDto = {

  id : string;

  content: string;

  author : {

    id : string;

    name : string,

    avatar : string,

  },

  media : any;

  createAt : Date;

  totalReact : number ;

  totalComment : number;
}

/**
 * Đối tượng map với bài post
 * @author : Tr4nLa4m (20-11-2022)
 */
export const mapSendPost = {

  "id" : "id",

  "content" : "content",

  "author.id" : "author.id",

  "author.name" : "author.name",

  "author.avatar" : "author.avatar",

  "createdAt" : "createdAt",

  "medias" : [
    {
      key: "medias?",
      transform: function (value) { 
        if(!value){
          return [];
        }
        return value;
      }
    },
  ],

  "totalReact" : [
    {
      key: "totalReact?",
      transform: function (value) { 
        if(!value){
          return 0;
        }
        return value;
      }
    },
  ],
  "totalComment" : {
    key: "totalComment?",
    transform: function (value) { 
      if(!value){
        return 0;
      }
      return value;
    }
  },

}