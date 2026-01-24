import { Module } from '@nestjs/common';
import { PlayerController } from './controllers/player.controller';
import { PlayerService } from './services/player.service';
import { PlayerDao } from './daos/player.dao';

@Module({
  controllers: [PlayerController],
  providers: [PlayerService, PlayerDao],
  exports: [PlayerService, PlayerDao],
})
export class PlayerModule {}
