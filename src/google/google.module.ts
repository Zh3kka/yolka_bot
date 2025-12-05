import { Module } from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { DriveService } from './drive.service';

@Module({
  providers: [SheetsService, DriveService],
  exports: [SheetsService, DriveService],
})
export class GoogleModule {}

