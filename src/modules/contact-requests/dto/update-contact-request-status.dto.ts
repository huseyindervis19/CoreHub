import { IsEnum, IsOptional } from 'class-validator';
import { ContactRequestStatus } from '@prisma/client';

export class UpdateContactRequestStatusDto {
  @IsOptional()
  @IsEnum(ContactRequestStatus, { message: 'Status must be one of: pending, in_progress, completed' })
  status?: ContactRequestStatus;
}
