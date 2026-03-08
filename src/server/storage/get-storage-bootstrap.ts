export type StorageTargetId = "applicationSettings" | "userFiles";

export interface StorageTargetBootstrap {
  id: StorageTargetId;
  requiredScope: string;
  writesUserVisibleFiles: boolean;
}

export interface StorageBootstrap {
  architecture: {
    dataStrategy: "ssr-first";
    middleendLocation: "src/modules";
    routing: "pages-router";
  };
  authStatus: "configured" | "pending";
  requiredScopes: string[];
  storageTargets: StorageTargetBootstrap[];
}

interface GetStorageBootstrapInput {
  isGoogleOAuthConfigured: boolean;
  requiredScopes: readonly string[];
}

export function getStorageBootstrap({
  isGoogleOAuthConfigured,
  requiredScopes,
}: GetStorageBootstrapInput): StorageBootstrap {
  return {
    architecture: {
      dataStrategy: "ssr-first",
      middleendLocation: "src/modules",
      routing: "pages-router",
    },
    authStatus: isGoogleOAuthConfigured ? "configured" : "pending",
    requiredScopes: [...requiredScopes],
    storageTargets: [
      {
        id: "applicationSettings",
        requiredScope: "https://www.googleapis.com/auth/drive.appdata",
        writesUserVisibleFiles: false,
      },
      {
        id: "userFiles",
        requiredScope: "https://www.googleapis.com/auth/drive.file",
        writesUserVisibleFiles: true,
      },
    ],
  };
}
