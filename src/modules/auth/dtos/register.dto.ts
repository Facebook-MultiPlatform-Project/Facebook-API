import {
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxDate,
  MinLength
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../enums/gender.enum';

export class RegisterDto {
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

  @ApiProperty({
    required : true,
    type : String
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name : string

  @ApiProperty({
    required : false,
  })
  @IsOptional()
  @Transform( ({ value }) => value && new Date(value))
  @IsDate()
  @MaxDate(new Date(), {message : "Ngày sinh không được lớn hơn ngày hiện tại"})
  birthday : Date;

  @IsOptional()
  @IsEnum(Gender, {message : "Kiểu enum không hợp lệ"})
  gender : Gender;

}

export default RegisterDto;
