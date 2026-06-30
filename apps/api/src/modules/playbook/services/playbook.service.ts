import { Injectable, NotFoundException } from '@nestjs/common';
import { CommunityMemberDao } from '@/modules/community/daos/community-member.dao';
import { PlaybookDao } from '../daos/playbook.dao';
import { PlaybookChecklistItemDao } from '../daos/playbook-checklist-item.dao';
import { PlaybookDto, toPlaybookDto } from '../dtos/playbook.dto';
import { CreatePlaybookDto } from '../dtos/create-playbook.dto';
import { UpdatePlaybookDto } from '../dtos/update-playbook.dto';
import {
  CreateChecklistItemDto,
  PlaybookChecklistItemDto,
  UpdateChecklistItemDto,
  toChecklistItemDto,
} from '../dtos/playbook-checklist-item.dto';

@Injectable()
export class PlaybookService {
  constructor(
    private readonly playbookDao: PlaybookDao,
    private readonly checklistDao: PlaybookChecklistItemDao,
    private readonly communityMemberDao: CommunityMemberDao,
  ) {}

  async list(userId: string): Promise<PlaybookDto[]> {
    const rows = await this.playbookDao.findAllByUser(userId);
    return rows.map((row) => toPlaybookDto(row));
  }

  async getById(id: string, userId: string): Promise<PlaybookDto> {
    let row = await this.playbookDao.findByIdForUser(id, userId);
    if (!row) {
      const playbook = await this.playbookDao.findById(id);
      if (
        !playbook ||
        !(await this.communityMemberDao.canMentorViewMemberContent(
          userId,
          playbook.userId,
        ))
      ) {
        throw new NotFoundException(`Playbook ${id} not found`);
      }
      row = playbook;
    }
    const checklist = await this.checklistDao.findByPlaybook(id);
    return toPlaybookDto(row, checklist);
  }

  async create(userId: string, dto: CreatePlaybookDto): Promise<PlaybookDto> {
    const row = await this.playbookDao.create({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      marketConditions: dto.marketConditions ?? null,
      entryCriteria: dto.entryCriteria ?? null,
      exitCriteria: dto.exitCriteria ?? null,
      riskRules: dto.riskRules ?? null,
      invalidationRules: dto.invalidationRules ?? null,
    });
    if (!row) {
      throw new NotFoundException('Failed to create playbook');
    }
    const checklist = await this.checklistDao.replaceForPlaybook(
      row.id,
      this.normalizeChecklistInput(dto.checklist),
    );
    return toPlaybookDto(row, checklist);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePlaybookDto,
  ): Promise<PlaybookDto> {
    const row = await this.playbookDao.updateForUser(id, userId, { ...dto });
    if (!row) {
      throw new NotFoundException(`Playbook ${id} not found`);
    }
    let checklist = await this.checklistDao.findByPlaybook(id);
    if (dto.checklist !== undefined) {
      checklist = await this.checklistDao.replaceForPlaybook(
        id,
        this.normalizeChecklistInput(dto.checklist),
      );
    }
    return toPlaybookDto(row, checklist);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.playbookDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Playbook ${id} not found`);
    }
  }

  // ==================== Checklist items ====================

  private normalizeChecklistInput(
    items?: { text: string; sortOrder?: number }[],
  ): { text: string; sortOrder: number }[] {
    if (!items?.length) {
      return [];
    }

    return items.map((item, index) => ({
      text: item.text.trim(),
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private async assertOwnedPlaybook(
    playbookId: string,
    userId: string,
  ): Promise<void> {
    const playbook = await this.playbookDao.findByIdForUser(playbookId, userId);
    if (!playbook) {
      throw new NotFoundException(`Playbook ${playbookId} not found`);
    }
  }

  async listChecklist(
    playbookId: string,
    userId: string,
  ): Promise<PlaybookChecklistItemDto[]> {
    await this.assertOwnedPlaybook(playbookId, userId);
    const rows = await this.checklistDao.findByPlaybook(playbookId);
    return rows.map(toChecklistItemDto);
  }

  async addChecklistItem(
    playbookId: string,
    userId: string,
    dto: CreateChecklistItemDto,
  ): Promise<PlaybookChecklistItemDto> {
    await this.assertOwnedPlaybook(playbookId, userId);
    const row = await this.checklistDao.create({
      playbookId,
      text: dto.text,
      sortOrder: dto.sortOrder ?? 0,
    });
    if (!row) {
      throw new NotFoundException('Failed to create checklist item');
    }
    return toChecklistItemDto(row);
  }

  async updateChecklistItem(
    playbookId: string,
    itemId: string,
    userId: string,
    dto: UpdateChecklistItemDto,
  ): Promise<PlaybookChecklistItemDto> {
    await this.assertOwnedPlaybook(playbookId, userId);
    const row = await this.checklistDao.updateForPlaybook(itemId, playbookId, {
      ...dto,
    });
    if (!row) {
      throw new NotFoundException(`Checklist item ${itemId} not found`);
    }
    return toChecklistItemDto(row);
  }

  async removeChecklistItem(
    playbookId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    await this.assertOwnedPlaybook(playbookId, userId);
    const deleted = await this.checklistDao.deleteForPlaybook(itemId, playbookId);
    if (!deleted) {
      throw new NotFoundException(`Checklist item ${itemId} not found`);
    }
  }
}
