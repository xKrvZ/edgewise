import {

  BadRequestException,

  Injectable,

  Logger,

  NotFoundException,

} from '@nestjs/common';

import { nanoid } from 'nanoid';

import type { Selectable } from 'kysely';

import type { TraderProfile } from '@/database/types/db';

import { PlaybookDao } from '@/modules/playbook/daos/playbook.dao';

import { StorageService } from '@/modules/storage/storage.service';

import {

  MAX_AVATAR_BYTES,

  MAX_FAVORITE_SYMBOLS,

  MAX_HEADER_BYTES,

  PROFILE_IMAGE_TYPES,

  SHARE_TOKEN_LENGTH,

  type StatsVisibility,

} from '../constants/sharing.constants';

import { TraderProfilePlaybookDao } from '../daos/trader-profile-playbook.dao';

import { TraderProfileDao } from '../daos/trader-profile.dao';

import {

  ProfileAvatarUploadRequestDto,

  ProfileHeaderUploadRequestDto,

  ProfileUploadTargetDto,

} from '../dtos/profile-upload.dto';

import {

  TraderProfileDto,

  UpdateTraderProfileDto,

} from '../dtos/trader-profile.dto';



@Injectable()

export class TraderProfileService {

  private readonly logger = new Logger(TraderProfileService.name);



  constructor(

    private readonly traderProfileDao: TraderProfileDao,

    private readonly traderProfilePlaybookDao: TraderProfilePlaybookDao,

    private readonly playbookDao: PlaybookDao,

    private readonly storage: StorageService,

  ) {}



  async getOrCreate(userId: string): Promise<TraderProfileDto> {

    const row = await this.ensureProfile(userId);

    return this.toDto(row, userId);

  }



  async update(

    userId: string,

    dto: UpdateTraderProfileDto,

  ): Promise<TraderProfileDto> {

    const existing = await this.ensureProfile(userId);



    if (dto.avatarStorageKey !== undefined) {

      await this.applyStorageKeyUpdate(

        userId,

        'avatar',

        existing.avatarStorageKey,

        dto.avatarStorageKey,

      );

    }



    if (dto.headerStorageKey !== undefined) {

      await this.applyStorageKeyUpdate(

        userId,

        'header',

        existing.headerStorageKey,

        dto.headerStorageKey,

      );

    }



    const nextVisibility = dto.statsVisibility ?? existing.statsVisibility;

    let statsShareToken = existing.statsShareToken ?? null;
    if (!statsShareToken) {
      statsShareToken = nanoid(SHARE_TOKEN_LENGTH);
    }

    const favoriteSymbols =

      dto.favoriteSymbols !== undefined

        ? this.normalizeFavoriteSymbols(dto.favoriteSymbols)

        : undefined;



    const sharePlaybooks =

      dto.sharePlaybooks !== undefined

        ? dto.sharePlaybooks

        : existing.sharePlaybooks;



    if (dto.sharedPlaybookIds !== undefined) {

      await this.syncSharedPlaybooks(userId, dto.sharedPlaybookIds);

    } else if (

      dto.sharePlaybooks === false &&

      sharePlaybooks === false

    ) {

      await this.traderProfilePlaybookDao.replaceForUser(userId, []);

    }



    const row = await this.traderProfileDao.updateForUser(userId, {

      ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),

      ...(dto.bio !== undefined ? { bio: dto.bio } : {}),

      ...(dto.avatarStorageKey !== undefined

        ? { avatarStorageKey: dto.avatarStorageKey }

        : {}),

      ...(dto.headerStorageKey !== undefined

        ? { headerStorageKey: dto.headerStorageKey }

        : {}),

      ...(favoriteSymbols !== undefined ? { favoriteSymbols } : {}),

      ...(dto.sharePlaybooks !== undefined

        ? { sharePlaybooks: dto.sharePlaybooks }

        : {}),

      statsVisibility: nextVisibility as StatsVisibility,

      statsShareToken,

    });



    return this.toDto(row ?? existing, userId);

  }



  async requestAvatarUpload(

    userId: string,

    dto: ProfileAvatarUploadRequestDto,

  ): Promise<ProfileUploadTargetDto> {

    this.assertProfileImage(dto.contentType, dto.sizeBytes, MAX_AVATAR_BYTES);

    const storageKey = this.storage.buildProfileKey(

      userId,

      'avatar',

      dto.filename,

    );

    return this.buildUploadTarget(storageKey, dto.contentType);

  }



  async requestHeaderUpload(

    userId: string,

    dto: ProfileHeaderUploadRequestDto,

  ): Promise<ProfileUploadTargetDto> {

    this.assertProfileImage(dto.contentType, dto.sizeBytes, MAX_HEADER_BYTES);

    const storageKey = this.storage.buildProfileKey(

      userId,

      'header',

      dto.filename,

    );

    return this.buildUploadTarget(storageKey, dto.contentType);

  }



  private async applyStorageKeyUpdate(

    userId: string,

    asset: 'avatar' | 'header',

    currentKey: string | null,

    nextKey: string | null,

  ): Promise<void> {

    if (nextKey === null) {

      if (currentKey) {

        await this.deleteStorageObject(currentKey);

      }

      return;

    }



    const prefix = asset === 'avatar' ? 'avatars/' : 'headers/';

    if (!nextKey.startsWith(`${prefix}${userId}/`)) {

      throw new BadRequestException('Invalid storage key for this profile asset');

    }



    if (currentKey && currentKey !== nextKey) {

      await this.deleteStorageObject(currentKey);

    }

  }



  private async syncSharedPlaybooks(

    userId: string,

    playbookIds: string[],

  ): Promise<void> {

    const uniqueIds = [...new Set(playbookIds)];

    for (const playbookId of uniqueIds) {

      const playbook = await this.playbookDao.findByIdForUser(playbookId, userId);

      if (!playbook) {

        throw new NotFoundException(`Playbook ${playbookId} not found`);

      }

    }

    await this.traderProfilePlaybookDao.replaceForUser(userId, uniqueIds);

  }



  private normalizeFavoriteSymbols(symbols: string[]): string[] {

    const normalized = symbols

      .map((symbol) => symbol.trim().toUpperCase())

      .filter(Boolean);

    const unique = [...new Set(normalized)];

    if (unique.length > MAX_FAVORITE_SYMBOLS) {

      throw new BadRequestException(

        `At most ${MAX_FAVORITE_SYMBOLS} favorite symbols allowed`,

      );

    }

    return unique;

  }



  private assertProfileImage(

    contentType: string,

    sizeBytes: number,

    maxBytes: number,

  ): void {

    if (!PROFILE_IMAGE_TYPES.includes(contentType as (typeof PROFILE_IMAGE_TYPES)[number])) {

      throw new BadRequestException(`Unsupported image content type: ${contentType}`);

    }

    if (sizeBytes > maxBytes) {

      const mb = Math.round(maxBytes / (1024 * 1024));

      throw new BadRequestException(`Image exceeds the maximum size of ${mb} MB`);

    }

  }



  private async buildUploadTarget(

    storageKey: string,

    contentType: string,

  ): Promise<ProfileUploadTargetDto> {

    const uploadUrl = await this.storage.presignUpload(storageKey, contentType);

    return {

      uploadUrl,

      storageKey,

      expiresIn: this.storage.uploadExpirySeconds,

    };

  }



  private async deleteStorageObject(key: string): Promise<void> {

    try {

      await this.storage.deleteObject(key);

    } catch (error) {

      this.logger.warn(`Failed to delete object ${key}`, error as Error);

    }

  }



  private async ensureProfile(

    userId: string,

  ): Promise<Selectable<TraderProfile>> {

    const existing = await this.traderProfileDao.findByUserId(userId);

    if (existing) {
      if (!existing.statsShareToken) {
        const statsShareToken = nanoid(SHARE_TOKEN_LENGTH);
        const updated = await this.traderProfileDao.updateForUser(userId, {
          statsShareToken,
        });
        return updated ?? { ...existing, statsShareToken };
      }
      return existing;
    }



    const created = await this.traderProfileDao.create({

      userId,

      displayName: null,

      bio: null,

      avatarStorageKey: null,

      headerStorageKey: null,

      favoriteSymbols: [],

      sharePlaybooks: false,

      statsVisibility: 'private',

      statsShareToken: nanoid(SHARE_TOKEN_LENGTH),

    });



    return (

      created ?? {

        userId,

        displayName: null,

        bio: null,

        avatarStorageKey: null,

        headerStorageKey: null,

        favoriteSymbols: [],

        sharePlaybooks: false,

        statsVisibility: 'private',

        statsShareToken: nanoid(SHARE_TOKEN_LENGTH),

        createdAt: new Date(),

        updatedAt: new Date(),

      }

    );

  }



  private async toDto(

    row: Selectable<TraderProfile>,

    userId: string,

  ): Promise<TraderProfileDto> {

    const [avatarUrl, headerUrl, sharedPlaybookIds] = await Promise.all([

      row.avatarStorageKey

        ? this.storage.presignDownload(row.avatarStorageKey)

        : Promise.resolve(null),

      row.headerStorageKey

        ? this.storage.presignDownload(row.headerStorageKey)

        : Promise.resolve(null),

      this.traderProfilePlaybookDao.findPlaybookIdsByUser(userId),

    ]);



    return {

      displayName: row.displayName,

      bio: row.bio,

      avatarUrl,

      headerUrl,

      favoriteSymbols: row.favoriteSymbols ?? [],

      sharePlaybooks: row.sharePlaybooks ?? false,

      sharedPlaybookIds,

      statsVisibility: row.statsVisibility as StatsVisibility,

      statsShareToken: row.statsShareToken ?? null,

    };

  }

}

