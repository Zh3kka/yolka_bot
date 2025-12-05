import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google, sheets_v4 } from "googleapis";
import {
  RegistrationData,
  ChildData,
} from "../shared/types/registration.types";

@Injectable()
export class SheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor(private configService: ConfigService) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.configService.get<string>(
          "GOOGLE_SERVICE_ACCOUNT_EMAIL"
        ),
        private_key: this.configService
          .get<string>("GOOGLE_PRIVATE_KEY")
          ?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.spreadsheetId =
      this.configService.get<string>("GOOGLE_SPREADSHEET_ID") || "";
  }

  private formatChildrenData(children: ChildData[]): string {
    if (!children || children.length === 0) return "";

    return children
      .map((child, index) => {
        const lines: string[] = [];
        lines.push(`${index + 1}) ${child.name}, ${child.age} лет`);

        if (child.hasPerformance && child.performanceDescription) {
          lines.push(`   Номер: ${child.performanceDescription}`);
        } else {
          lines.push(`   Номер: нет`);
        }

        return lines.join("\n");
      })
      .join("\n\n");
  }

  async appendRegistration(data: RegistrationData): Promise<void> {
    const childrenDataStr = this.formatChildrenData(data.childrenData || []);

    const guestsNamesStr =
      data.guestsNames && data.guestsNames.length > 0
        ? data.guestsNames.join(", ")
        : "";

    const values = [
      [
        data.timestamp,
        data.telegramId.toString(),
        data.username,
        data.fullName,
        data.status,
        data.guestsCount?.toString() || "",
        guestsNamesStr,
        data.childrenCount?.toString() || "",
        childrenDataStr,
        data.childhoodPhotoUrl || "",
        data.currentPhotoUrl || "",
      ],
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: "A:K",
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });
  }
}
