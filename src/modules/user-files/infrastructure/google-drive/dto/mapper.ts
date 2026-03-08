import type { StoredUserFile } from "../../../domain/entities/stored-user-file";
import type { GoogleDriveUserFileDto } from "./google-drive-user-file.dto";

export function mapGoogleDriveUserFileDtoToDomain(
  dto: GoogleDriveUserFileDto,
): StoredUserFile {
  if (!dto.id || !dto.name || !dto.mimeType) {
    throw new Error(
      "Cannot map a Google Drive user file DTO without id, name, and mimeType.",
    );
  }

  return {
    id: dto.id,
    mimeType: dto.mimeType,
    name: dto.name,
    viewUrl: dto.webViewLink ?? null,
  };
}
