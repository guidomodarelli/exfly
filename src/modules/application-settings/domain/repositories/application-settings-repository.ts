import type { ApplicationSettingsDocument } from "../entities/application-settings-document";
import type { StoredApplicationSettings } from "../entities/stored-application-settings";

export interface ApplicationSettingsRepository {
  save(
    document: ApplicationSettingsDocument,
  ): Promise<StoredApplicationSettings>;
}
