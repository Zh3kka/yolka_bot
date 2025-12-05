import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { SessionService } from './session.service';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [BotUpdate, BotService, SessionService],
})
export class BotModule {}

