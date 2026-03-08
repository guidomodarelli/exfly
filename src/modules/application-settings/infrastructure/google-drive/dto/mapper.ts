import type { StoredApplicationSettings } from "../../../domain/entities/stored-application-settings";
import type { GoogleDriveSettingsFileDto } from "./google-drive-settings-file.dto";

export function mapGoogleDriveSettingsFileDtoToDomain(
  dto: GoogleDriveSettingsFileDto,
): StoredApplicationSettings {
  if (!dto.id || !dto.name || !dto.mimeType) {
    throw new Error(
      "Cannot map a Google Drive settings DTO without id, name, and mimeType.",
    );
  }

  return {
    id: dto.id,
    mimeType: dto.mimeType,
    name: dto.name,
  };
}
