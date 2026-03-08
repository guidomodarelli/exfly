import type { drive_v3 } from "googleapis";

import type { StoredUserFile } from "../../../domain/entities/stored-user-file";
import type { UserFileUpload } from "../../../domain/entities/user-file-upload";
import type { UserFilesRepository } from "../../../domain/repositories/user-files-repository";
import { mapGoogleDriveUserFileDtoToDomain } from "../dto/mapper";

const DRIVE_FILE_FIELDS = "id,name,mimeType,webViewLink";

export class GoogleDriveUserFilesRepository implements UserFilesRepository {
  constructor(private readonly driveClient: drive_v3.Drive) {}

  async save(file: UserFileUpload): Promise<StoredUserFile> {
    const response = await this.driveClient.files.create({
      fields: DRIVE_FILE_FIELDS,
      media: {
        body: file.content,
        mimeType: file.mimeType,
      },
      requestBody: {
        name: file.name,
      },
    });

    return mapGoogleDriveUserFileDtoToDomain(response.data);
  }
}
