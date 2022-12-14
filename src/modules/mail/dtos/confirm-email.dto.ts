import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{1,6}$/, { message: 'Verify code is not valid' })
  verifyCode: string;

  @ApiProperty({ required: true, type: String })
  @IsNotEmpty()
  @IsEmail()
  email : string;
}

export default ConfirmEmailDto;
