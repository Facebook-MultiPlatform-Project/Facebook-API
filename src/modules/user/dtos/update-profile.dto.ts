import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxDate,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Gender } from 'src/modules/auth/enums/gender.enum';

/**
 * Dto cập nhật thông tin người dùng
 * @author : Tr4nLa4m (27-11-2022)
 */
export class UpdateProfileDto {

  // Tên người dùng
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name: string;

  // Ngày sinh
  @ApiPropertyOptional({
    type : Date
  })
  @IsOptional()
  @Transform( ({ value }) => value && new Date(value))
  @IsDate()
  @MaxDate(new Date())
  birthday : Date;

  // Giới tính
  @ApiPropertyOptional({ enum: [Gender.FEMALE, Gender.MALE, Gender.OTHER]})
  @IsOptional()
  @IsEnum(Gender)
  gender : Gender;
}

export default UpdateProfileDto;
