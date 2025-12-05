import { Injectable } from '@nestjs/common';
import { SheetsService } from '../google/sheets.service';
import { UserSession } from '../shared/types/session.types';
import {
  RegistrationData,
  ParticipationStatus,
} from '../shared/types/registration.types';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class BotService {
  constructor(private sheetsService: SheetsService) {}

  private getMoscowTimestamp(): string {
    return formatInTimeZone(new Date(), 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');
  }

  async saveRegistration(session: UserSession): Promise<void> {
    const data: RegistrationData = {
      timestamp: this.getMoscowTimestamp(),
      telegramId: session.telegramId,
      username: session.username,
      fullName: session.fullName || '',
      status: session.status || ParticipationStatus.GOING,
      guestsCount: session.guestsCount,
      guestsNames:
        session.guestsNames.length > 0 ? session.guestsNames : undefined,
      childrenCount: session.childrenCount,
      childrenData:
        session.childrenData.length > 0 ? session.childrenData : undefined,
      childhoodPhotoUrl: session.childhoodPhotoUrl,
      currentPhotoUrl: session.currentPhotoUrl,
    };

    await this.sheetsService.appendRegistration(data);
  }
}

