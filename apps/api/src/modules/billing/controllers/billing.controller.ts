import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AllowWithoutSubscription } from '../decorators/allow-without-subscription.decorator';
import { EntitlementsDto } from '../dtos/entitlements.dto';
import { UserFeaturesDto } from '../dtos/user-features.dto';
import { InvoicesPageDto } from '../dtos/invoice.dto';
import { BillingService } from '../services/billing.service';

@ApiTags('Billing')
@Controller('billing')
@AllowWithoutSubscription()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('features')
  @ApiOperation({ summary: 'Current user Edgewise features and access status' })
  @ApiOkResponse({ type: UserFeaturesDto })
  async getFeatures(@Session() session: UserSession): Promise<UserFeaturesDto> {
    return this.billingService.getFeatures(session.user.id, session.user.email);
  }

  /** @deprecated Use GET /billing/features */
  @Get('entitlements')
  @ApiOperation({
    summary: 'Deprecated — use GET /billing/features',
    deprecated: true,
  })
  @ApiOkResponse({ type: EntitlementsDto })
  async getEntitlements(@Session() session: UserSession): Promise<EntitlementsDto> {
    return this.billingService.getEntitlements(session.user.id, session.user.email);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices for the authenticated user from Polar' })
  @ApiOkResponse({ type: InvoicesPageDto })
  async listInvoices(@Session() session: UserSession): Promise<InvoicesPageDto> {
    return this.billingService.listInvoices(session.user.id);
  }
}
