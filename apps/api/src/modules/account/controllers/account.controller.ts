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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AccountService } from '../services/account.service';
import { AccountDto } from '../dtos/account.dto';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user trading accounts' })
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async list(@Session() session: UserSession): Promise<AccountDto[]> {
    return this.accountService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single trading account by id' })
  @ApiOkResponse({ type: AccountDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<AccountDto> {
    return this.accountService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a trading account' })
  @ApiCreatedResponse({ type: AccountDto })
  async create(
    @Body() dto: CreateAccountDto,
    @Session() session: UserSession,
  ): Promise<AccountDto> {
    return this.accountService.create(session.user.id, dto, session.user.email);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trading account' })
  @ApiOkResponse({ type: AccountDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
    @Session() session: UserSession,
  ): Promise<AccountDto> {
    return this.accountService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a trading account' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.accountService.remove(id, session.user.id);
  }
}
