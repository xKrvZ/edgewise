import { Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import type { Selectable } from 'kysely';
import type { Screenshot, Trade } from '@/database/types/db';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { ScreenshotDao } from '@/modules/screenshot/daos/screenshot.dao';
import { type MediaKind } from '@/modules/storage/constants/storage.constants';
import { StorageService } from '@/modules/storage/storage.service';
import { TradeDao } from '@/modules/trade/daos/trade.dao';
import {
  SHARE_TOKEN_LENGTH,
  type StatsVisibility,
  type TradeVisibility,
} from '../constants/sharing.constants';
import { PublicProfileDto } from '../dtos/public-profile.dto';
import { PublicStatsDto } from '../dtos/public-stats.dto';
import { PublicTradeMediaDto } from '../dtos/public-trade-media.dto';
import { PublicTradeDto } from '../dtos/public-trade.dto';
import { TradeSharingDto } from '../dtos/trade-sharing.dto';
import { TraderProfilePlaybookDao } from '../daos/trader-profile-playbook.dao';
import { TraderProfileDao } from '../daos/trader-profile.dao';

@Injectable()
export class SharingService {
  constructor(
    private readonly tradeDao: TradeDao,
    private readonly traderProfileDao: TraderProfileDao,
    private readonly traderProfilePlaybookDao: TraderProfilePlaybookDao,
    private readonly analyticsService: AnalyticsService,
    private readonly screenshotDao: ScreenshotDao,
    private readonly storage: StorageService,
  ) {}

  async updateTradeSharing(
    tradeId: string,
    userId: string,
    visibility: TradeVisibility,
  ): Promise<TradeSharingDto> {
    const existing = await this.tradeDao.findByIdForUser(tradeId, userId);
    if (!existing) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    const shareToken =
      visibility === 'private'
        ? null
        : nanoid(SHARE_TOKEN_LENGTH);

    const row = await this.tradeDao.updateSharingForUser(tradeId, userId, {
      visibility,
      shareToken,
    });
    if (!row) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    return this.toTradeSharingDto(row);
  }

  async getPublicTrade(shareToken: string): Promise<PublicTradeDto> {
    const context = await this.tradeDao.findPublicByShareToken(shareToken);
    if (!context) {
      throw new NotFoundException('Shared trade not found');
    }

    const [tagNames, media] = await Promise.all([
      this.tradeDao.getTagNames(context.trade.id),
      this.loadPublicMedia(context.trade.id),
    ]);

    return this.toPublicTradeDto(context.trade, {
      setupName: context.setupName,
      sessionName: context.sessionName,
      tagNames,
      media,
    });
  }

  async getPublicStats(shareToken: string): Promise<PublicStatsDto> {
    const profile = await this.getPublicProfile(shareToken);
    if (!profile.overview || !profile.equityCurve) {
      throw new NotFoundException('Shared stats not found');
    }

    return {
      displayName: profile.displayName,
      bio: profile.bio,
      overview: profile.overview,
      equityCurve: profile.equityCurve,
    };
  }

  async getPublicProfile(shareToken: string): Promise<PublicProfileDto> {
    const profile = await this.traderProfileDao.findByShareToken(shareToken);
    if (!profile) {
      throw new NotFoundException('Shared profile not found');
    }

    const [avatarUrl, headerUrl, playbooks, stats] = await Promise.all([
      profile.avatarStorageKey
        ? this.storage.presignDownload(profile.avatarStorageKey)
        : Promise.resolve(null),
      profile.headerStorageKey
        ? this.storage.presignDownload(profile.headerStorageKey)
        : Promise.resolve(null),
      profile.sharePlaybooks
        ? this.traderProfilePlaybookDao.findSharedPlaybooksForUser(profile.userId)
        : Promise.resolve([]),
      profile.statsVisibility === 'public'
        ? Promise.all([
            this.analyticsService.getOverview(profile.userId, {}),
            this.analyticsService.getEquityCurve(profile.userId, {}),
          ])
        : Promise.resolve([null, null] as const),
    ]);

    const [overview, equityCurve] = stats;

    return {
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl,
      headerUrl,
      favoriteSymbols: profile.favoriteSymbols ?? [],
      playbooks,
      overview,
      equityCurve,
    };
  }

  toTradeSharingDto(row: Selectable<Trade>): TradeSharingDto {
    return {
      visibility: row.visibility as TradeVisibility,
      shareToken: row.shareToken ?? null,
    };
  }

  private async loadPublicMedia(tradeId: string): Promise<PublicTradeMediaDto[]> {
    const rows = await this.screenshotDao.findPublicByTradeId(tradeId);
    return Promise.all(rows.map((row) => this.toPublicMediaDto(row)));
  }

  private async toPublicMediaDto(
    row: Selectable<Screenshot>,
  ): Promise<PublicTradeMediaDto> {
    const url = row.storageKey
      ? await this.storage.presignDownload(row.storageKey)
      : (row.url ?? '');

    return {
      id: row.id,
      kind: (row.kind as MediaKind) ?? 'image',
      url,
      caption: row.caption,
      contentType: row.contentType,
    };
  }

  private toPublicTradeDto(
    row: Selectable<Trade>,
    labels: {
      setupName: string | null;
      sessionName: string | null;
      tagNames: string[];
      media: PublicTradeMediaDto[];
    },
  ): PublicTradeDto {
    return {
      symbol: row.symbol,
      marketType: row.marketType as PublicTradeDto['marketType'],
      direction: row.direction as PublicTradeDto['direction'],
      entryPrice: toRequiredNumber(row.entryPrice),
      exitPrice: toNumber(row.exitPrice),
      quantity: toRequiredNumber(row.quantity),
      stopLoss: toNumber(row.stopLoss),
      takeProfit: toNumber(row.takeProfit),
      fees: toRequiredNumber(row.fees),
      pnl: toNumber(row.pnl),
      rMultiple: toNumber(row.rMultiple),
      entryTime: row.entryTime,
      exitTime: row.exitTime,
      emotion: row.emotion,
      executionRating: row.executionRating,
      notes: row.notes,
      status: row.status as PublicTradeDto['status'],
      setupName: labels.setupName,
      sessionName: labels.sessionName,
      tagNames: labels.tagNames,
      visibility: row.visibility as TradeVisibility,
      media: labels.media,
    };
  }
}
