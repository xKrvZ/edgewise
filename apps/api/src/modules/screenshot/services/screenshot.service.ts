import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Selectable } from 'kysely';
import type { Screenshot } from '@/database/types/db';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MEDIA_KINDS,
  type MediaKind,
} from '@/modules/storage/constants/storage.constants';
import { StorageService } from '@/modules/storage/storage.service';
import type { MediaVisibility } from '../constants/screenshot.constants';
import { ScreenshotDao } from '../daos/screenshot.dao';
import {
  CreateScreenshotDto,
  RequestUploadDto,
  ScreenshotDto,
  ScreenshotQueryDto,
  UpdateScreenshotDto,
  UploadTargetDto,
} from '../dtos/screenshot.dto';

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);

  constructor(
    private readonly screenshotDao: ScreenshotDao,
    private readonly storage: StorageService,
  ) {}

  /**
   * Validates the requested upload and returns a short-lived presigned PUT URL.
   * The browser uploads the bytes directly to object storage, then calls
   * {@link create} with the returned `storageKey` to persist the reference.
   */
  async requestUpload(
    userId: string,
    dto: RequestUploadDto,
  ): Promise<UploadTargetDto> {
    const kind = this.assertKind(dto.kind);
    this.assertContentType(kind, dto.contentType);
    this.assertSize(kind, dto.sizeBytes);

    const storageKey = this.storage.buildKey(userId, kind, dto.filename);
    const uploadUrl = await this.storage.presignUpload(
      storageKey,
      dto.contentType,
    );

    return {
      uploadUrl,
      storageKey,
      expiresIn: this.storage.uploadExpirySeconds,
    };
  }

  async list(
    userId: string,
    query: ScreenshotQueryDto,
  ): Promise<ScreenshotDto[]> {
    const rows = await this.screenshotDao.findAllByUser(userId, {
      tradeId: query.tradeId,
      playbookId: query.playbookId,
    });
    return Promise.all(rows.map((row) => this.toDto(row)));
  }

  async getById(id: string, userId: string): Promise<ScreenshotDto> {
    const row = await this.screenshotDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Screenshot ${id} not found`);
    }
    return this.toDto(row);
  }

  async create(
    userId: string,
    dto: CreateScreenshotDto,
  ): Promise<ScreenshotDto> {
    if (!dto.storageKey && !dto.url) {
      throw new BadRequestException('Either storageKey or url is required');
    }

    const kind = this.assertKind(dto.kind ?? 'image');
    if (dto.storageKey && dto.contentType) {
      this.assertContentType(kind, dto.contentType);
    }

    const row = await this.screenshotDao.create({
      userId,
      tradeId: dto.tradeId ?? null,
      playbookId: dto.playbookId ?? null,
      url: dto.storageKey ? null : (dto.url as string),
      storageKey: dto.storageKey ?? null,
      kind,
      contentType: dto.contentType ?? null,
      sizeBytes: dto.sizeBytes ?? null,
      caption: dto.caption ?? null,
      visibility: dto.visibility ?? 'private',
    });
    if (!row) {
      throw new NotFoundException('Failed to create screenshot');
    }
    return this.toDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateScreenshotDto,
  ): Promise<ScreenshotDto> {
    const row = await this.screenshotDao.updateForUser(id, userId, { ...dto });
    if (!row) {
      throw new NotFoundException(`Screenshot ${id} not found`);
    }
    return this.toDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const row = await this.screenshotDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Screenshot ${id} not found`);
    }

    if (row.storageKey) {
      try {
        await this.storage.deleteObject(row.storageKey);
      } catch (error) {
        // Don't block the DB delete on a storage hiccup; log for cleanup.
        this.logger.warn(
          `Failed to delete object ${row.storageKey} for screenshot ${id}`,
          error as Error,
        );
      }
    }

    await this.screenshotDao.deleteForUser(id, userId);
  }

  /**
   * Maps a row to its DTO, minting a fresh presigned GET URL for uploaded
   * objects (private bucket) and passing through external URLs untouched.
   */
  private async toDto(row: Selectable<Screenshot>): Promise<ScreenshotDto> {
    const url = row.storageKey
      ? await this.storage.presignDownload(row.storageKey)
      : (row.url ?? '');

    return {
      id: row.id,
      userId: row.userId,
      tradeId: row.tradeId,
      playbookId: row.playbookId,
      kind: (row.kind as MediaKind) ?? 'image',
      url,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      caption: row.caption,
      visibility: (row.visibility as MediaVisibility) ?? 'private',
      createdAt: row.createdAt,
    };
  }

  private assertKind(kind: string): MediaKind {
    if (!MEDIA_KINDS.includes(kind as MediaKind)) {
      throw new BadRequestException(`Unsupported media kind: ${kind}`);
    }
    return kind as MediaKind;
  }

  private assertContentType(kind: MediaKind, contentType: string): void {
    const allowed =
      kind === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.includes(contentType as never)) {
      throw new BadRequestException(
        `Unsupported ${kind} content type: ${contentType}`,
      );
    }
  }

  private assertSize(kind: MediaKind, sizeBytes: number): void {
    const max = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (sizeBytes > max) {
      const mb = Math.round(max / (1024 * 1024));
      throw new BadRequestException(
        `${kind} exceeds the maximum size of ${mb} MB`,
      );
    }
  }
}
