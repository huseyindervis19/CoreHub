import { IsDefined, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateProductImageDto {
  @IsDefined({ message: 'Product ID is required' })
  @IsInt({ message: 'Product ID must be an integer' })
  productId: number;

  @IsOptional()
  @IsBoolean({ message: 'isMain must be a boolean' })
  isMain?: boolean;
}
