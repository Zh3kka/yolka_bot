import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import * as https from "https";
import * as http from "http";

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private drive: drive_v3.Drive;
  private folderId: string;

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
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    this.drive = google.drive({ version: "v3", auth });
    this.folderId =
      this.configService.get<string>("GOOGLE_DRIVE_FOLDER_ID") || "";
  }

  async uploadPhoto(
    fileUrl: string,
    fileName: string
  ): Promise<string | undefined> {
    try {
      const fileStream = await this.downloadFileAsStream(fileUrl);

      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [this.folderId],
        },
        media: {
          mimeType: "image/jpeg",
          body: fileStream,
        },
        fields: "id, webViewLink",
        supportsAllDrives: true,
      });

      if (response.data.id) {
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
          supportsAllDrives: true,
        });
      }

      return response.data.webViewLink || undefined;
    } catch (error) {
      this.logger.error("Failed to upload photo to Google Drive", error);
      return undefined;
    }
  }

  private downloadFileAsStream(url: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;
      protocol
        .get(url, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.downloadFileAsStream(redirectUrl)
                .then(resolve)
                .catch(reject);
              return;
            }
          }
          resolve(response as unknown as Readable);
        })
        .on("error", reject);
    });
  }
}
