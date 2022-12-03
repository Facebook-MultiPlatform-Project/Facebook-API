import {
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Email is not valid' })
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
        'Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password: string;

  @ApiProperty({
    required : true,
    type : String
  })
  @IsString()
  @IsNotEmpty()
  name : string

  @ApiProperty({
    required : false,
  })
  @IsOptional()
  @Transform( ({ value }) => value && new Date(value))
  @IsDate()
  @MaxDate(new Date())
  birthday : Date;

  @IsOptional()
  @IsEnum(Gender)
  gender : Gender;

}

export default RegisterDto;
