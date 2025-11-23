import { Module } from '@nestjs/common';
import { ContactRequestService } from './contact-request.service';
import { ContactRequestController } from './contact-request.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ContactRequestService],
  controllers: [ContactRequestController],
})
export class ContactRequestModule {}
