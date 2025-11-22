import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeSliderDto } from './create-home-slider.dto';

export class UpdateHomeSliderDto extends PartialType(CreateHomeSliderDto) {}