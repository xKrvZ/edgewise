import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ScreenshotService } from '../services/screenshot.service';
import {
  CreateScreenshotDto,
  RequestUploadDto,
  ScreenshotDto,
  ScreenshotQueryDto,
  UpdateScreenshotDto,
  UploadTargetDto,
} from '../dtos/screenshot.dto';

@ApiTags('Screenshots')
@Controller('screenshots')
export class ScreenshotController {
  constructor(private readonly screenshotService: ScreenshotService) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Get a presigned URL to upload a trade screenshot/video',
  })
  @ApiCreatedResponse({ type: UploadTargetDto })
  async requestUpload(
    @Body() dto: RequestUploadDto,
    @Session() session: UserSession,
  ): Promise<UploadTargetDto> {
    return this.screenshotService.requestUpload(session.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List screenshots (optionally by trade/playbook)' })
  @ApiOkResponse({ type: ScreenshotDto, isArray: true })
  async list(
    @Query() query: ScreenshotQueryDto,
    @Session() session: UserSession,
  ): Promise<ScreenshotDto[]> {
    return this.screenshotService.list(session.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a screenshot by id' })
  @ApiOkResponse({ type: ScreenshotDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<ScreenshotDto> {
    return this.screenshotService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a screenshot reference' })
  @ApiCreatedResponse({ type: ScreenshotDto })
  async create(
    @Body() dto: CreateScreenshotDto,
    @Session() session: UserSession,
  ): Promise<ScreenshotDto> {
    return this.screenshotService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a screenshot caption or share visibility' })
  @ApiOkResponse({ type: ScreenshotDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScreenshotDto,
    @Session() session: UserSession,
  ): Promise<ScreenshotDto> {
    return this.screenshotService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a screenshot' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.screenshotService.remove(id, session.user.id);
  }
}
