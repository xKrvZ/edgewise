import { Module } from '@nestjs/common';
import { NoteController } from './controllers/note.controller';
import { NoteService } from './services/note.service';
import { NoteDao } from './daos/note.dao';

@Module({
  controllers: [NoteController],
  providers: [NoteService, NoteDao],
  exports: [NoteService, NoteDao],
})
export class NoteModule {}
