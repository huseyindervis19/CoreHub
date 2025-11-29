import { IsDefined, IsNotEmpty, IsString, MaxLength, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsDefined({ message: 'Name is required' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must be shorter than or equal to 100 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  slug?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Stock quantity must be an integer' })
  @Min(0, { message: 'Stock quantity cannot be negative' })
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isFeatured must be a boolean' })
  isFeatured?: boolean;

  @IsOptional()
  @IsInt({ message: 'categoryId must be an integer' })
  categoryId?: number;

  @IsNotEmpty()
  priority: number;
}
