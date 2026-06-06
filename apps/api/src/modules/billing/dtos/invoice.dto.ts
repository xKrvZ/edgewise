import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceRowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ description: 'Amount in cents' })
  amount!: number;

  @ApiProperty({ example: 'usd' })
  currency!: string;

  @ApiProperty({ example: 'paid' })
  status!: string;

  @ApiPropertyOptional({ example: 'INV-2024-0001' })
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Polar invoice PDF URL when available' })
  invoiceUrl?: string;
}

export class InvoicesPageDto {
  @ApiProperty({ type: [InvoiceRowDto] })
  items!: InvoiceRowDto[];

  @ApiProperty({ enum: ['mock', 'polar'] })
  provider!: 'mock' | 'polar';
}
