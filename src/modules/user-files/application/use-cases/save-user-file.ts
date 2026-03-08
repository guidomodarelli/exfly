import { normalizeFilePayload } from "@/lib/files/normalize-file-payload";

import type { StoredUserFile } from "../../domain/entities/stored-user-file";
import type { UserFileUpload } from "../../domain/entities/user-file-upload";
import type { UserFilesRepository } from "../../domain/repositories/user-files-repository";
import type { SaveUserFileCommand } from "../commands/save-user-file-command";

interface SaveUserFileDependencies {
  command: SaveUserFileCommand;
  repository: UserFilesRepository;
}

export async function saveUserFile({
  command,
  repository,
}: SaveUserFileDependencies): Promise<StoredUserFile> {
  const validatedFile: UserFileUpload = normalizeFilePayload(
    command,
    "Saving a user file",
  );

  return repository.save(validatedFile);
}
