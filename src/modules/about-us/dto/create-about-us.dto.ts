import { IsString, IsOptional } from 'class-validator';

export class CreateAboutUsDto {
  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  imageUrl: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @IsString()
  mission?: string;

  @IsOptional()
  @IsString()
  vision?: string;

  @IsOptional()
  @IsString()
  values?: string;
}
