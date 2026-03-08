import { normalizeFilePayload } from "@/lib/files/normalize-file-payload";

import type { ApplicationSettingsDocument } from "../../domain/entities/application-settings-document";
import type { StoredApplicationSettings } from "../../domain/entities/stored-application-settings";
import type { ApplicationSettingsRepository } from "../../domain/repositories/application-settings-repository";
import type { SaveApplicationSettingsCommand } from "../commands/save-application-settings-command";

interface SaveApplicationSettingsDependencies {
  command: SaveApplicationSettingsCommand;
  repository: ApplicationSettingsRepository;
}

export async function saveApplicationSettings({
  command,
  repository,
}: SaveApplicationSettingsDependencies): Promise<StoredApplicationSettings> {
  const validatedDocument: ApplicationSettingsDocument = normalizeFilePayload(
    command,
    "Saving application settings",
  );

  return repository.save(validatedDocument);
}
