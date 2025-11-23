import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateContactRequestDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  message: string;

}