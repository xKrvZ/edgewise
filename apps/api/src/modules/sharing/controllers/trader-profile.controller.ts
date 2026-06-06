import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ProfileAvatarUploadRequestDto,
  ProfileHeaderUploadRequestDto,
  ProfileUploadTargetDto,
} from '../dtos/profile-upload.dto';
import {
  TraderProfileDto,
  UpdateTraderProfileDto,
} from '../dtos/trader-profile.dto';
import { AllowWithoutSubscription } from '@/modules/billing/decorators/allow-without-subscription.decorator';
import { TraderProfileService } from '../services/trader-profile.service';

@ApiTags('Profile')
@Controller('users/me/profile')
@AllowWithoutSubscription()
export class TraderProfileController {
  constructor(private readonly traderProfileService: TraderProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user trading profile' })
  @ApiOkResponse({ type: TraderProfileDto })
  getProfile(@Session() session: UserSession): Promise<TraderProfileDto> {
    return this.traderProfileService.getOrCreate(session.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update trading profile and sharing settings' })
  @ApiOkResponse({ type: TraderProfileDto })
  updateProfile(
    @Body() dto: UpdateTraderProfileDto,
    @Session() session: UserSession,
  ): Promise<TraderProfileDto> {
    return this.traderProfileService.update(session.user.id, dto);
  }

  @Post('avatar/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload a profile avatar' })
  @ApiCreatedResponse({ type: ProfileUploadTargetDto })
  requestAvatarUpload(
    @Body() dto: ProfileAvatarUploadRequestDto,
    @Session() session: UserSession,
  ): Promise<ProfileUploadTargetDto> {
    return this.traderProfileService.requestAvatarUpload(session.user.id, dto);
  }

  @Post('header/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload a profile header banner' })
  @ApiCreatedResponse({ type: ProfileUploadTargetDto })
  requestHeaderUpload(
    @Body() dto: ProfileHeaderUploadRequestDto,
    @Session() session: UserSession,
  ): Promise<ProfileUploadTargetDto> {
    return this.traderProfileService.requestHeaderUpload(session.user.id, dto);
  }
}
