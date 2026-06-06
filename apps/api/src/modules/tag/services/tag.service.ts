import { Injectable, NotFoundException } from '@nestjs/common';
import { TagDao } from '../daos/tag.dao';
import { TagDto, toTagDto } from '../dtos/tag.dto';
import { CreateTagDto } from '../dtos/create-tag.dto';
import { UpdateTagDto } from '../dtos/update-tag.dto';

@Injectable()
export class TagService {
  constructor(private readonly tagDao: TagDao) {}

  async list(userId: string): Promise<TagDto[]> {
    const rows = await this.tagDao.findAllByUser(userId);
    return rows.map(toTagDto);
  }

  async getById(id: string, userId: string): Promise<TagDto> {
    const row = await this.tagDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Tag ${id} not found`);
    }
    return toTagDto(row);
  }

  async create(userId: string, dto: CreateTagDto): Promise<TagDto> {
    const row = await this.tagDao.create({
      userId,
      name: dto.name,
      color: dto.color ?? null,
      category: dto.category ?? 'custom',
    });
    if (!row) {
      throw new NotFoundException('Failed to create tag');
    }
    return toTagDto(row);
  }

  async update(id: string, userId: string, dto: UpdateTagDto): Promise<TagDto> {
    const row = await this.tagDao.updateForUser(id, userId, { ...dto });
    if (!row) {
      throw new NotFoundException(`Tag ${id} not found`);
    }
    return toTagDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.tagDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Tag ${id} not found`);
    }
  }
}
