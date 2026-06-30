import { Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import type { Selectable } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import type { Screenshot, Trade } from '@/database/types/db';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import {
  resolveUserAvatarUrl,
  resolveUserHeaderUrl,
} from '@/modules/privacy/utils/resolve-user-avatar.util';
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
import { PublicProfileQueryDto } from '../dtos/public-profile-query.dto';
import { PublicShowcasedTradesPageDto } from '../dtos/public-showcased-trades-page.dto';
import { PublicStatsDto } from '../dtos/public-stats.dto';
import { PublicTradeMediaDto } from '../dtos/public-trade-media.dto';
import { PublicTradeTraderDto } from '../dtos/public-trade-trader.dto';
import { PublicTradeDto } from '../dtos/public-trade.dto';
import { TradeSharingDto } from '../dtos/trade-sharing.dto';
import { TraderProfileHiddenTradeDao } from '../daos/trader-profile-hidden-trade.dao';
import { TraderProfilePlaybookDao } from '../daos/trader-profile-playbook.dao';
import { TraderProfileTradeDao } from '../daos/trader-profile-trade.dao';
import { TraderProfileTradingAccountDao } from '../daos/trader-profile-trading-account.dao';
import { TraderProfileDao } from '../daos/trader-profile.dao';

@Injectable()
export class SharingService {
  constructor(
    private readonly tradeDao: TradeDao,
    private readonly traderProfileDao: TraderProfileDao,
    private readonly traderProfilePlaybookDao: TraderProfilePlaybookDao,
    private readonly traderProfileTradeDao: TraderProfileTradeDao,
    private readonly traderProfileHiddenTradeDao: TraderProfileHiddenTradeDao,
    private readonly traderProfileTradingAccountDao: TraderProfileTradingAccountDao,
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

    await this.syncTradeShowcaseOnSharingChange(userId, tradeId, visibility);

    return this.toTradeSharingDto(row);
  }

  async getPublicTrade(shareToken: string): Promise<PublicTradeDto> {
    const context = await this.tradeDao.findPublicByShareToken(shareToken);
    if (!context) {
      throw new NotFoundException('Shared trade not found');
    }

    const [tagNames, media, trader] = await Promise.all([
      this.tradeDao.getTagNames(context.trade.id),
      this.loadPublicMedia(context.trade.id),
      this.loadPublicTradeTrader(context.trade.userId),
    ]);

    return this.toPublicTradeDto(context.trade, {
      setupName: context.setupName,
      sessionName: context.sessionName,
      tagNames,
      media,
      trader,
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

  async getPublicProfile(
    shareToken: string,
    query: PublicProfileQueryDto = new PublicProfileQueryDto(),
  ): Promise<PublicProfileDto> {
    const profile = await this.traderProfileDao.findByShareToken(shareToken);
    if (!profile) {
      throw new NotFoundException('Shared profile not found');
    }

    const publicTradingAccountIds =
      await this.traderProfileTradingAccountDao.findTradingAccountIdsByUser(profile.userId);

    const statsFilters =
      publicTradingAccountIds.length > 0 ? { accountIds: publicTradingAccountIds } : null;

    const [avatarUrl, headerUrl, playbooks, showcasedTrades, stats] = await Promise.all([
      profile.avatarStorageKey
        ? this.storage.presignDownload(profile.avatarStorageKey)
        : Promise.resolve(null),
      profile.headerStorageKey
        ? this.storage.presignDownload(profile.headerStorageKey)
        : Promise.resolve(null),
      profile.sharePlaybooks
        ? this.traderProfilePlaybookDao.findSharedPlaybooksForUser(profile.userId)
        : Promise.resolve([]),
      profile.shareTrades
        ? this.loadShowcasedTrades(
            profile.userId,
            publicTradingAccountIds,
            query.page ?? 1,
            query.limit ?? 10,
          )
        : Promise.resolve(new PublicShowcasedTradesPageDto({ items: [], total: 0, page: 1, limit: query.limit ?? 10 })),
      profile.statsVisibility === 'public' && statsFilters
        ? Promise.all([
            this.analyticsService.getOverview(profile.userId, statsFilters),
            this.analyticsService.getEquityCurve(profile.userId, statsFilters),
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
      showcasedTrades,
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

  private async loadPublicTradeTrader(userId: string): Promise<PublicTradeTraderDto> {
    const summary = await this.traderProfileDao.findShareSummaryByUserId(userId);

    if (!summary) {
      return {
        displayName: 'Trader',
        handle: null,
        avatarUrl: null,
        headerUrl: null,
        profilePublic: false,
        profileShareToken: null,
      };
    }

    const displayName = resolveUserDisplayLabel({
      displayName: summary.displayName,
      name: summary.userName,
      email: summary.userEmail,
    });

    const trimmedDisplayName = summary.displayName?.trim();
    const handle =
      trimmedDisplayName &&
      summary.userName?.trim() &&
      summary.userName.trim() !== trimmedDisplayName
        ? summary.userName.trim()
        : null;

    const [avatarUrl, headerUrl] = await Promise.all([
      resolveUserAvatarUrl(this.storage, {
        userImage: summary.userImage,
        avatarStorageKey: summary.avatarStorageKey,
      }),
      resolveUserHeaderUrl(this.storage, {
        headerStorageKey: summary.headerStorageKey,
      }),
    ]);

    const profilePublic = summary.statsVisibility === 'public';

    return {
      displayName,
      handle,
      avatarUrl,
      headerUrl,
      profilePublic,
      profileShareToken:
        profilePublic && summary.statsShareToken ? summary.statsShareToken : null,
    };
  }

  private async loadShowcasedTrades(
    userId: string,
    tradingAccountIds: string[],
    page: number,
    limit: number,
  ): Promise<PublicShowcasedTradesPageDto> {
    const hiddenTradeIds = await this.traderProfileHiddenTradeDao.findTradeIdsByUser(userId);

    const showcasedCount = await this.traderProfileTradeDao.countShowcasedTradesForUser(
      userId,
      tradingAccountIds,
      hiddenTradeIds,
    );
    const useSelected = showcasedCount > 0;

    const [total, rows] = await Promise.all([
      useSelected
        ? Promise.resolve(showcasedCount)
        : this.traderProfileTradeDao.countSharedTradesForUser(
            userId,
            tradingAccountIds,
            hiddenTradeIds,
          ),
      useSelected
        ? this.traderProfileTradeDao.findShowcasedTradesForUser(
            userId,
            tradingAccountIds,
            page,
            limit,
            hiddenTradeIds,
          )
        : this.traderProfileTradeDao.findSharedTradesForUser(
            userId,
            page,
            limit,
            tradingAccountIds,
            hiddenTradeIds,
          ),
    ]);

    const items = await Promise.all(
      rows.map(async (row) => {
        const screenshot = await this.screenshotDao.findFirstPublicByTradeId(row.tradeId);
        const thumbnailUrl =
          screenshot?.storageKey != null
            ? await this.storage.presignDownload(screenshot.storageKey)
            : (screenshot?.url ?? null);

        return {
          tradeId: row.tradeId,
          shareToken: row.shareToken,
          symbol: row.symbol,
          direction: row.direction,
          marketType: row.marketType,
          pnl: toNumber(row.pnl),
          rMultiple: toNumber(row.rMultiple),
          status: row.status,
          entryTime: row.entryTime,
          exitTime: row.exitTime,
          thumbnailUrl,
        };
      }),
    );

    return new PublicShowcasedTradesPageDto({ items, total, page, limit });
  }

  private async syncTradeShowcaseOnSharingChange(
    userId: string,
    tradeId: string,
    visibility: TradeVisibility,
  ): Promise<void> {
    if (visibility !== 'public') {
      await this.traderProfileTradeDao.removeTradeForUser(userId, tradeId);
      return;
    }

    let profile = await this.traderProfileDao.findByUserId(userId);
    if (!profile) {
      profile = await this.traderProfileDao.create({
        userId,
        displayName: null,
        bio: null,
        avatarStorageKey: null,
        headerStorageKey: null,
        favoriteSymbols: [],
        sharePlaybooks: false,
        shareTrades: true,
        statsVisibility: 'private',
        statsShareToken: nanoid(SHARE_TOKEN_LENGTH),
      });
    }

    if (!profile || profile.shareTrades) {
      return;
    }

    await this.traderProfileDao.updateForUser(userId, { shareTrades: true });
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
      trader: PublicTradeTraderDto;
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
      trader: labels.trader,
    };
  }
}
