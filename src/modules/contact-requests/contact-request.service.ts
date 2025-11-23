import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { wrapResponse, formatList, formatSingle } from '../../common';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { UpdateContactRequestStatusDto } from './dto/update-contact-request-status.dto';

@Injectable()
export class ContactRequestService {
  private readonly basePath = '/contact-requests';

  constructor(private readonly prisma: PrismaService) {}

  // ---------------- CREATE ----------------
  async create(dto: CreateContactRequestDto) {
    const created = await this.prisma.contactRequest.create({ data: dto });
    return wrapResponse(formatSingle(created, this.basePath));
  }

  // ---------------- GET ALL ----------------
  async findAll() {
    const requests = await this.prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const { data, meta, links } = formatList(requests, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- GET ONE ----------------
  async findOne(id: number) {
    const request = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`ContactRequest ${id} not found`);
    return wrapResponse(formatSingle(request, this.basePath));
  }

  // ---------------- UPDATE STATUS ONLY ----------------
  async updateStatus(id: number, dto: UpdateContactRequestStatusDto) {
    const request = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`ContactRequest ${id} not found`);

    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }

    const allowedStatuses = ['pending', 'in_progress', 'completed'] as const;
    if (!allowedStatuses.includes(dto.status as typeof allowedStatuses[number])) {
      throw new BadRequestException(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
    }

    const updated = await this.prisma.contactRequest.update({
      where: { id },
      data: { status: dto.status },
    });

    return wrapResponse(formatSingle(updated, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number) {
    const request = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`ContactRequest ${id} not found`);
    const deleted = await this.prisma.contactRequest.delete({ where: { id } });
    return wrapResponse(formatSingle(deleted, this.basePath));
  }
}
