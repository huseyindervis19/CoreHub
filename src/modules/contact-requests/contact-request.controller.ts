import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ContactRequestService } from './contact-request.service';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { UpdateContactRequestStatusDto } from './dto/update-contact-request-status.dto';

@Controller('contact-requests')
export class ContactRequestController {
  constructor(private readonly service: ContactRequestService) {}

  @Post()
  async create(@Body() dto: CreateContactRequestDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateContactRequestStatusDto) {
    return this.service.updateStatus(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
