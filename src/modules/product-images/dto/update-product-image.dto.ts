import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @IsBoolean({ message: 'isMain must be a boolean' })
  isMain?: boolean;
}
