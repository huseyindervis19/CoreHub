import { IsDefined, IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsDefined({ message: 'Name is required' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must be shorter than or equal to 100 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isFeatured must be a boolean' })
@Transform(({ obj }) => obj.isFeatured === 'true')
  isFeatured?: boolean;
}
