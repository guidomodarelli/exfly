import {
  ALLOWED_SHARED_RECEIPT_MIME_TYPES,
  MAX_SHARED_RECEIPT_SIZE_BYTES,
  type AllowedSharedReceiptMimeType,
  type SharedReceiptPayload,
} from "@/modules/monthly-expenses/infrastructure/pwa/shared-receipt-payload";

type NavigatorLike = {
  maxTouchPoints?: number;
  platform?: string;
  userAgent?: string;
};

const ALLOWED_MIME_SET = new Set<string>(ALLOWED_SHARED_RECEIPT_MIME_TYPES);

export function isIosShareTargetUnsupported(
  navigatorLike?: NavigatorLike | null,
): boolean {
  if (!navigatorLike) {
    return false;
  }

  const userAgent = navigatorLike.userAgent ?? "";

  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return true;
  }

  const platform = navigatorLike.platform ?? "";
  const maxTouchPoints = Number(navigatorLike.maxTouchPoints ?? 0);

  return platform === "MacIntel" && maxTouchPoints > 1;
}

export type FilePickerResult =
  | { payload: SharedReceiptPayload; status: "ok" }
  | { message: string; status: "error" };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("No se pudo leer el archivo."));
    };

    reader.readAsDataURL(file);
  });
}

function sanitizeFileName(name: string): string {
  const normalized = name
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "-");

  return normalized ? normalized.slice(0, 180) : "comprobante";
}

export async function buildPayloadFromFile(file: File): Promise<FilePickerResult> {
  const mimeType = file.type.trim().toLowerCase();

  if (!ALLOWED_MIME_SET.has(mimeType)) {
    return {
      message: "Solo se admiten comprobantes PDF, JPG, PNG, WEBP, HEIC o HEIF.",
      status: "error",
    };
  }

  if (
    !Number.isFinite(file.size) ||
    file.size <= 0 ||
    file.size > MAX_SHARED_RECEIPT_SIZE_BYTES
  ) {
    return {
      message: "El comprobante debe pesar entre 1 byte y 5 MB.",
      status: "error",
    };
  }

  const contentBase64 = await fileToBase64(file);

  if (!contentBase64) {
    return {
      message: "No pudimos leer el contenido del archivo.",
      status: "error",
    };
  }

  return {
    payload: {
      contentBase64,
      fileName: sanitizeFileName(file.name),
      mimeType: mimeType as AllowedSharedReceiptMimeType,
      receivedAtIso: new Date().toISOString(),
      sizeBytes: file.size,
      source: "manual-file-picker",
    },
    status: "ok",
  };
}
