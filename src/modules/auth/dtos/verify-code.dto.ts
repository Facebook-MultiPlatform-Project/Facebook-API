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
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../enums/gender.enum';

export class VerifyDto {

  @ApiProperty({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{1,6}$/, { message: 'Verify code is not valid' })
  verifyCode: string;
}

export default VerifyDto;
