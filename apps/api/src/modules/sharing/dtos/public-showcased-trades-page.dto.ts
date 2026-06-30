import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PublicShowcasedTradeDto } from './public-showcased-trade.dto';

export class PublicShowcasedTradesPageDto {
  @Expose()
  @ApiProperty({ type: PublicShowcasedTradeDto, isArray: true })
  @Type(() => PublicShowcasedTradeDto)
  items: PublicShowcasedTradeDto[];

  @Expose()
  @ApiProperty({ example: 12 })
  total: number;

  @Expose()
  @ApiProperty({ example: 1 })
  page: number;

  @Expose()
  @ApiProperty({ example: 10 })
  limit: number;

  @Expose()
  @ApiProperty({ example: 2 })
  pageCount: number;

  constructor(data: { items: PublicShowcasedTradeDto[]; total: number; page: number; limit: number }) {
    this.items = data.items;
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.pageCount = data.limit > 0 ? Math.ceil(data.total / data.limit) : 0;
  }
}
