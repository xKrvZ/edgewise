import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlaybookChecklistItemDao } from '@/modules/playbook/daos/playbook-checklist-item.dao';
import { PlaybookDao } from '@/modules/playbook/daos/playbook.dao';
import { PlaybookDto, toPlaybookDto } from '@/modules/playbook/dtos/playbook.dto';
import { CommunityDao } from '../daos/community.dao';
import { CommunityMemberDao } from '../daos/community-member.dao';
import { CommunityPlaybookTemplateChecklistItemDao } from '../daos/community-playbook-template-checklist-item.dao';
import { CommunityPlaybookTemplateDao } from '../daos/community-playbook-template.dao';
import type { CommunityMemberRole, CommunityPlaybookTemplateVisibility } from '../constants/community.constants';
import {
  type CommunityPlaybookTemplateDto,
  toCommunityPlaybookTemplateDto,
} from '../dtos/community-playbook-template.dto';
import type { CloneCommunityPlaybookTemplateDto } from '../dtos/clone-community-playbook-template.dto';
import type { CreateCommunityPlaybookTemplateDto } from '../dtos/create-community-playbook-template.dto';
import type { UpdateCommunityPlaybookTemplateDto } from '../dtos/create-community-playbook-template.dto';

@Injectable()
export class CommunityPlaybookTemplateService {
  constructor(
    private readonly templateDao: CommunityPlaybookTemplateDao,
    private readonly checklistDao: CommunityPlaybookTemplateChecklistItemDao,
    private readonly memberDao: CommunityMemberDao,
    private readonly communityDao: CommunityDao,
    private readonly playbookDao: PlaybookDao,
    private readonly playbookChecklistDao: PlaybookChecklistItemDao,
  ) {}

  async listTemplates(
    communityId: string,
    userId: string,
  ): Promise<CommunityPlaybookTemplateDto[]> {
    await this.requireCommunityExists(communityId);

    const membership = await this.memberDao.findMembership(communityId, userId);
    const rows = await this.templateDao.findByCommunity(
      communityId,
      membership ? undefined : { visibility: 'public' },
    );

    return this.toTemplateDtos(rows, userId, membership !== null);
  }

  async getTemplate(
    communityId: string,
    templateId: string,
    userId: string,
  ): Promise<CommunityPlaybookTemplateDto> {
    await this.requireCommunityExists(communityId);

    const row = await this.templateDao.findByIdInCommunity(templateId, communityId);
    if (!row || row.deletedAt) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    const canView = await this.canViewTemplate(row, userId);
    if (!canView) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    const checklist = await this.checklistDao.findByTemplate(templateId);
    const membership = await this.memberDao.findMembership(communityId, userId);
    const alreadyCloned =
      membership !== null
        ? await this.playbookDao.hasClonedFromTemplate(userId, templateId)
        : false;
    return toCommunityPlaybookTemplateDto(row, checklist, alreadyCloned);
  }

  async createTemplate(
    communityId: string,
    userId: string,
    dto: CreateCommunityPlaybookTemplateDto,
  ): Promise<CommunityPlaybookTemplateDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const visibility: CommunityPlaybookTemplateVisibility = dto.visibility ?? 'members_only';
    const checklistItems = this.normalizeChecklistInput(dto.checklist);

    const row = await this.templateDao.create({
      communityId,
      createdByUserId: userId,
      name,
      description: this.normalizeOptionalText(dto.description),
      marketConditions: this.normalizeOptionalText(dto.marketConditions),
      entryCriteria: this.normalizeOptionalText(dto.entryCriteria),
      exitCriteria: this.normalizeOptionalText(dto.exitCriteria),
      riskRules: this.normalizeOptionalText(dto.riskRules),
      invalidationRules: this.normalizeOptionalText(dto.invalidationRules),
      visibility,
    });
    if (!row) {
      throw new NotFoundException('Failed to create playbook template');
    }

    const checklist = await this.checklistDao.replaceForTemplate(row.id, checklistItems);
    return toCommunityPlaybookTemplateDto(row, checklist);
  }

  async updateTemplate(
    communityId: string,
    templateId: string,
    userId: string,
    dto: UpdateCommunityPlaybookTemplateDto,
  ): Promise<CommunityPlaybookTemplateDto> {
    const existing = await this.templateDao.findByIdInCommunity(templateId, communityId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    await this.requireCreatorOrMentorOrOwner(communityId, userId, existing.createdByUserId);

    const name = dto.name !== undefined ? dto.name.trim() : undefined;
    if (name === '') {
      throw new BadRequestException('Name is required');
    }

    const row = await this.templateDao.updateInCommunity(templateId, communityId, {
      ...(name !== undefined && { name }),
      ...(dto.description !== undefined && {
        description: this.normalizeOptionalText(dto.description),
      }),
      ...(dto.marketConditions !== undefined && {
        marketConditions: this.normalizeOptionalText(dto.marketConditions),
      }),
      ...(dto.entryCriteria !== undefined && {
        entryCriteria: this.normalizeOptionalText(dto.entryCriteria),
      }),
      ...(dto.exitCriteria !== undefined && {
        exitCriteria: this.normalizeOptionalText(dto.exitCriteria),
      }),
      ...(dto.riskRules !== undefined && {
        riskRules: this.normalizeOptionalText(dto.riskRules),
      }),
      ...(dto.invalidationRules !== undefined && {
        invalidationRules: this.normalizeOptionalText(dto.invalidationRules),
      }),
      ...(dto.visibility !== undefined && { visibility: dto.visibility }),
    });
    if (!row) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    let checklist = await this.checklistDao.findByTemplate(templateId);
    if (dto.checklist !== undefined) {
      checklist = await this.checklistDao.replaceForTemplate(
        templateId,
        this.normalizeChecklistInput(dto.checklist),
      );
    }

    return toCommunityPlaybookTemplateDto(row, checklist);
  }

  async removeTemplate(
    communityId: string,
    templateId: string,
    userId: string,
  ): Promise<void> {
    const existing = await this.templateDao.findByIdInCommunity(templateId, communityId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    await this.requireCreatorOrMentorOrOwner(communityId, userId, existing.createdByUserId);

    const deleted = await this.templateDao.softDeleteInCommunity(templateId, communityId);
    if (!deleted) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }
  }

  async cloneTemplate(
    communityId: string,
    templateId: string,
    userId: string,
    dto?: CloneCommunityPlaybookTemplateDto,
  ): Promise<PlaybookDto> {
    await this.requireMembership(communityId, userId);

    const template = await this.templateDao.findByIdInCommunity(templateId, communityId);
    if (!template || template.deletedAt) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    const canView = await this.canViewTemplate(template, userId);
    if (!canView) {
      throw new NotFoundException(`Playbook template ${templateId} not found`);
    }

    const playbookName =
      dto?.name !== undefined ? dto.name.trim() : template.name;
    if (!playbookName) {
      throw new BadRequestException('Name is required');
    }

    const checklist = await this.checklistDao.findByTemplate(templateId);

    const playbook = await this.playbookDao.create({
      userId,
      name: playbookName,
      description: template.description,
      marketConditions: template.marketConditions,
      entryCriteria: template.entryCriteria,
      exitCriteria: template.exitCriteria,
      riskRules: template.riskRules,
      invalidationRules: template.invalidationRules,
      clonedFromCommunityTemplateId: templateId,
    });
    if (!playbook) {
      throw new NotFoundException('Failed to clone playbook template');
    }

    const clonedItems: Awaited<ReturnType<PlaybookChecklistItemDao['findByPlaybook']>> = [];
    for (const item of checklist) {
      const created = await this.playbookChecklistDao.create({
        playbookId: playbook.id,
        text: item.text,
        sortOrder: item.sortOrder,
      });
      if (created) {
        clonedItems.push(created);
      }
    }

    return toPlaybookDto(playbook, clonedItems);
  }

  private async toTemplateDtos(
    rows: Awaited<ReturnType<CommunityPlaybookTemplateDao['findByCommunity']>>,
    userId: string,
    isMember: boolean,
  ): Promise<CommunityPlaybookTemplateDto[]> {
    const clonedTemplateIds = isMember
      ? await this.playbookDao.findClonedTemplateIdsForUser(
          userId,
          rows.map((row) => row.id),
        )
      : new Set<string>();

    return Promise.all(
      rows.map(async (row) => {
        const checklist = await this.checklistDao.findByTemplate(row.id);
        return toCommunityPlaybookTemplateDto(
          row,
          checklist,
          clonedTemplateIds.has(row.id),
        );
      }),
    );
  }

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

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async canViewTemplate(
    template: NonNullable<Awaited<ReturnType<CommunityPlaybookTemplateDao['findByIdInCommunity']>>>,
    userId: string,
  ): Promise<boolean> {
    if (template.visibility === 'public') {
      return true;
    }

    const membership = await this.memberDao.findMembership(template.communityId, userId);
    return membership !== null;
  }

  private isMentorOrOwner(role: string): role is CommunityMemberRole {
    return role === 'owner' || role === 'mentor';
  }

  private async requireCommunityExists(communityId: string) {
    const community = await this.communityDao.findById(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }
    return community;
  }

  private async requireMembership(communityId: string, userId: string) {
    const membership = await this.memberDao.findMembership(communityId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this community');
    }
    return membership;
  }

  private async requireMentorOrOwner(communityId: string, userId: string) {
    const membership = await this.requireMembership(communityId, userId);
    if (!this.isMentorOrOwner(membership.role)) {
      throw new ForbiddenException('Only mentors and owners can perform this action');
    }
    return membership;
  }

  private async requireCreatorOrMentorOrOwner(
    communityId: string,
    userId: string,
    createdByUserId: string,
  ) {
    const membership = await this.requireMembership(communityId, userId);
    if (this.isMentorOrOwner(membership.role) || createdByUserId === userId) {
      return membership;
    }
    throw new ForbiddenException('You do not have permission to modify this template');
  }
}
