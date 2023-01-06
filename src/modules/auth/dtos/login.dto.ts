import { ApiProperty } from '@nestjs/swagger/dist';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';


export class UserLoginDto {
  @ApiProperty({
    description: 'Email đăng ký',
    required: true,
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'email không hợp lệ' })
  email: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Mật khẩu cần tối thiểu 8 ký tự, tối thiểu một ký tự viết hoa, một ký tự thường, một chữ số và một ký tự đặc biệt',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Id thiết bị di động',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsUUID()
  uuid: string;
}
