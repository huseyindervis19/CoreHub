import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactInfoDto } from './dto/create-contact-info.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { wrapResponse, formatSingle } from '../../common';

@Injectable()
export class ContactInfoService {
  private readonly basePath = '/contact-info';

  constructor(private readonly prisma: PrismaService) {}

  // ---------------- CREATE (ONLY ONE) ----------------
  async create(dto: CreateContactInfoDto) {
    const exists = await this.prisma.contactInfo.findFirst();
    if (exists) {
      throw new BadRequestException(
        'Contact Info already exists. You can only update it.',
      );
    }

    const created = await this.prisma.$transaction(async tx => {
      const base = await tx.contactInfo.create({
        data: {
          phone: dto.phone,
          whatsapp: dto.whatsapp,
          email: dto.email,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });

      if (dto.address) {
        await this.createAddressTranslationForAllLanguages(base.id, dto.address, tx);
      }

      return base;
    });

    const translations = await this.getAddressTranslations(created.id);
    return wrapResponse(formatSingle({ ...created, translations }, this.basePath));
  }

  // ---------------- GET BY LANGUAGE ----------------
async getByLanguage(langCode: string) {
  const info = await this.prisma.contactInfo.findFirst();

  const lang = await this.prisma.language.findUnique({
    where: { code: langCode },
  });

  const translations = lang
    ? await this.prisma.dynamicTranslation.findMany({
        where: {
          tableName: 'ContactInfo',
          rowId: info?.id || 0,
          languageId: lang.id,
        },
      })
    : [];

  const translated = {
    address: translations.find(t => t.field === 'address')?.content || '',
  };

  const result = {
    ...(info as any),
    translated,
  };

  return wrapResponse(formatSingle(result, this.basePath));
}


  // ---------------- UPDATE ----------------
  async update(id: number, langCode: string, dto: UpdateContactInfoDto) {
    const info = await this.prisma.contactInfo.findUnique({ where: { id } });
    if (!info) throw new NotFoundException('Contact Info not found');

    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const updated = await this.prisma.contactInfo.update({
      where: { id },
      data: {
        phone: dto.phone ?? info.phone,
        whatsapp: dto.whatsapp ?? info.whatsapp,
        email: dto.email ?? info.email,
        latitude: dto.latitude ?? info.latitude,
        longitude: dto.longitude ?? info.longitude,
      },
    });

    if (dto.address !== undefined) {
      await this.updateAddressTranslation(id, language.id, dto.address);
    }

    const translations = await this.getAddressTranslations(id);
    return wrapResponse(formatSingle({ ...updated, translations }, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number) {
    const info = await this.prisma.contactInfo.findUnique({ where: { id } });
    if (!info) throw new NotFoundException('Contact Info not found');

    await this.prisma.dynamicTranslation.deleteMany({
      where: { tableName: 'ContactInfo', rowId: id },
    });

    await this.prisma.contactInfo.delete({ where: { id } });

    return wrapResponse(formatSingle(info, this.basePath));
  }

  // ================= HELPERS =================

  private async createAddressTranslationForAllLanguages(id: number, address: string, tx: any) {
    const languages = await tx.language.findMany();
    if (!languages.length) return;

    const translationsData = languages.map(lang => ({
      tableName: 'ContactInfo',
      rowId: id,
      field: 'address',
      languageId: lang.id,
      content: address,
    }));

    await tx.dynamicTranslation.createMany({ data: translationsData, skipDuplicates: true });
  }

  private async updateAddressTranslation(id: number, languageId: number, address: string) {
    await this.prisma.dynamicTranslation.upsert({
      where: {
        tableName_rowId_field_languageId: {
          tableName: 'ContactInfo',
          rowId: id,
          field: 'address',
          languageId,
        },
      },
      update: { content: address },
      create: {
        tableName: 'ContactInfo',
        rowId: id,
        field: 'address',
        languageId,
        content: address,
      },
    });
  }

  private async getAddressTranslations(id: number) {
    const translations = await this.prisma.dynamicTranslation.findMany({
      where: { tableName: 'ContactInfo', rowId: id },
      include: { Language: true },
    });

    const grouped: Record<string, { address: string }> = {};
    for (const t of translations) {
      const lang = t.Language.code;
      if (!grouped[lang]) grouped[lang] = { address: '' };
      grouped[lang].address = t.content;
    }

    return grouped;
  }
}