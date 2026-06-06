import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AllowWithoutSubscription } from '@/modules/billing/decorators/allow-without-subscription.decorator';
import { DeleteAccountDto } from '../dtos/delete-account.dto';
import { AccountDeletionService } from '../services/account-deletion.service';

@ApiTags('Account')
@Controller('account')
@AllowWithoutSubscription()
export class AccountDeletionController {
  constructor(private readonly accountDeletionService: AccountDeletionService) {}

  @Post('delete')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Permanently delete and anonymize the authenticated account',
    description:
      'Erases trading data and profile content. Retains anonymized user id plus billing records for Polar reconciliation.',
  })
  @ApiNoContentResponse()
  async deleteAccount(
    @Body() dto: DeleteAccountDto,
    @Session() session: UserSession,
  ): Promise<void> {
    await this.accountDeletionService.deleteAccount(
      session.user.id,
      dto.confirmation,
    );
  }
}
