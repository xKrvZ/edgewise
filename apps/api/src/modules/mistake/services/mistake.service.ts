import { Injectable, NotFoundException } from '@nestjs/common';
import { MistakeDao } from '../daos/mistake.dao';
import { MistakeDto, toMistakeDto } from '../dtos/mistake.dto';
import { CreateMistakeDto } from '../dtos/create-mistake.dto';
import { UpdateMistakeDto } from '../dtos/update-mistake.dto';

@Injectable()
export class MistakeService {
  constructor(private readonly mistakeDao: MistakeDao) {}

  async list(userId: string): Promise<MistakeDto[]> {
    const rows = await this.mistakeDao.findAllByUser(userId);
    return rows.map(toMistakeDto);
  }

  async getById(id: string, userId: string): Promise<MistakeDto> {
    const row = await this.mistakeDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Mistake ${id} not found`);
    }
    return toMistakeDto(row);
  }

  async create(userId: string, dto: CreateMistakeDto): Promise<MistakeDto> {
    const row = await this.mistakeDao.create({
      userId,
      name: dto.name,
      color: dto.color ?? null,
    });
    if (!row) {
      throw new NotFoundException('Failed to create mistake');
    }
    return toMistakeDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateMistakeDto,
  ): Promise<MistakeDto> {
    const row = await this.mistakeDao.updateForUser(id, userId, { ...dto });
    if (!row) {
      throw new NotFoundException(`Mistake ${id} not found`);
    }
    return toMistakeDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.mistakeDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Mistake ${id} not found`);
    }
  }
}
