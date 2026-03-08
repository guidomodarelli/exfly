import { useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type StorageSaveRequest,
  type StoredStorageResource,
  saveApplicationSettingsViaApi,
  saveUserFileViaApi,
} from "@/lib/storage/storage-api";
import { cn } from "@/lib/utils";

import styles from "./storage-playground.module.scss";

interface StoragePlaygroundProps {
  isOAuthConfigured: boolean;
}

interface StorageFormState {
  error: string | null;
  isSubmitting: boolean;
  result: StoredStorageResource | null;
  successMessage: string | null;
  values: StorageSaveRequest;
}

const DEFAULT_APPLICATION_SETTINGS_VALUES: StorageSaveRequest = {
  content: '{\n  "theme": "dark"\n}',
  mimeType: "application/json",
  name: "application-settings.json",
};

const DEFAULT_USER_FILE_VALUES: StorageSaveRequest = {
  content: "date,amount\n2026-03-08,32.5",
  mimeType: "text/csv",
  name: "expenses.csv",
};

function createStorageFormState(values: StorageSaveRequest): StorageFormState {
  return {
    error: null,
    isSubmitting: false,
    result: null,
    successMessage: null,
    values,
  };
}

function normalizeStorageValues(values: StorageSaveRequest): StorageSaveRequest {
  return {
    content: values.content.trim(),
    mimeType: values.mimeType.trim(),
    name: values.name.trim(),
  };
}

function getFieldValidationMessage(
  values: StorageSaveRequest,
  resourceLabel: string,
): string | null {
  const normalizedValues = normalizeStorageValues(values);

  if (
    !normalizedValues.name ||
    !normalizedValues.mimeType ||
    !normalizedValues.content
  ) {
    return `Completá nombre, MIME type y contenido para guardar ${resourceLabel}.`;
  }

  return null;
}

export function StoragePlayground({
  isOAuthConfigured,
}: StoragePlaygroundProps) {
  const { status } = useSession();
  const [applicationSettingsForm, setApplicationSettingsForm] =
    useState<StorageFormState>(
      createStorageFormState(DEFAULT_APPLICATION_SETTINGS_VALUES),
    );
  const [userFilesForm, setUserFilesForm] = useState<StorageFormState>(
    createStorageFormState(DEFAULT_USER_FILE_VALUES),
  );

  const isAuthenticated = status === "authenticated";
  const isSessionLoading = status === "loading";
  const sessionMessage = !isOAuthConfigured
    ? "Completá la configuración OAuth del servidor para habilitar el storage."
    : isSessionLoading
      ? "Estamos verificando tu sesión de Google."
      : isAuthenticated
        ? "Sesión Google activa. Ya podés guardar en Drive."
        : "Conectate con Google para habilitar el guardado en Drive.";

  const updateApplicationSettingsField = (
    fieldName: keyof StorageSaveRequest,
    value: string,
  ) => {
    setApplicationSettingsForm((currentState) => ({
      ...currentState,
      error: null,
      result: null,
      successMessage: null,
      values: {
        ...currentState.values,
        [fieldName]: value,
      },
    }));
  };

  const updateUserFilesField = (
    fieldName: keyof StorageSaveRequest,
    value: string,
  ) => {
    setUserFilesForm((currentState) => ({
      ...currentState,
      error: null,
      result: null,
      successMessage: null,
      values: {
        ...currentState.values,
        [fieldName]: value,
      },
    }));
  };

  const applicationSettingsValidationMessage = getFieldValidationMessage(
    applicationSettingsForm.values,
    "la configuración",
  );
  const userFilesValidationMessage = getFieldValidationMessage(
    userFilesForm.values,
    "el archivo del usuario",
  );

  const submitApplicationSettings = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (applicationSettingsValidationMessage || !isOAuthConfigured || !isAuthenticated) {
      return;
    }

    setApplicationSettingsForm((currentState) => ({
      ...currentState,
      error: null,
      isSubmitting: true,
      result: null,
      successMessage: null,
    }));

    try {
      const result = await saveApplicationSettingsViaApi(
        normalizeStorageValues(applicationSettingsForm.values),
      );

      setApplicationSettingsForm((currentState) => ({
        ...currentState,
        isSubmitting: false,
        result,
        successMessage: `Configuración guardada en Drive con id ${result.id}.`,
      }));
    } catch (error) {
      setApplicationSettingsForm((currentState) => ({
        ...currentState,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar la configuración en Google Drive.",
        isSubmitting: false,
      }));
    }
  };

  const submitUserFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (userFilesValidationMessage || !isOAuthConfigured || !isAuthenticated) {
      return;
    }

    setUserFilesForm((currentState) => ({
      ...currentState,
      error: null,
      isSubmitting: true,
      result: null,
      successMessage: null,
    }));

    try {
      const result = await saveUserFileViaApi(
        normalizeStorageValues(userFilesForm.values),
      );

      setUserFilesForm((currentState) => ({
        ...currentState,
        isSubmitting: false,
        result,
        successMessage: `Archivo guardado en Drive con id ${result.id}.`,
      }));
    } catch (error) {
      setUserFilesForm((currentState) => ({
        ...currentState,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar el archivo del usuario en Google Drive.",
        isSubmitting: false,
      }));
    }
  };

  return (
    <section
      aria-labelledby="storage-playground-title"
      className={styles.section}
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="storage-playground-title">
              Probar storage en Google Drive
            </h2>
          </CardTitle>
          <CardDescription>
            Guardá una configuración en `appDataFolder` o un archivo visible del
            usuario sin salir de esta pantalla.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <p
            className={cn(
              styles.sessionStatus,
              isAuthenticated ? styles.sessionReady : styles.sessionPending,
            )}
            role="status"
          >
            {sessionMessage}
          </p>

          <div className={styles.formsGrid}>
            <form className={styles.formCard} onSubmit={submitApplicationSettings}>
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>Guardar configuración</h3>
                <p className={styles.formDescription}>
                  Este formulario crea un archivo oculto para la app dentro de
                  `appDataFolder`.
                </p>
              </div>

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label
                    className={styles.label}
                    htmlFor="application-settings-name"
                  >
                    Nombre del archivo de configuración
                  </label>
                  <input
                    className={styles.input}
                    id="application-settings-name"
                    onChange={(event) =>
                      updateApplicationSettingsField("name", event.target.value)
                    }
                    type="text"
                    value={applicationSettingsForm.values.name}
                  />
                </div>

                <div className={styles.field}>
                  <label
                    className={styles.label}
                    htmlFor="application-settings-mime-type"
                  >
                    MIME type de la configuración
                  </label>
                  <input
                    className={styles.input}
                    id="application-settings-mime-type"
                    onChange={(event) =>
                      updateApplicationSettingsField(
                        "mimeType",
                        event.target.value,
                      )
                    }
                    type="text"
                    value={applicationSettingsForm.values.mimeType}
                  />
                </div>

                <div className={styles.field}>
                  <label
                    className={styles.label}
                    htmlFor="application-settings-content"
                  >
                    Contenido JSON
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="application-settings-content"
                    onChange={(event) =>
                      updateApplicationSettingsField(
                        "content",
                        event.target.value,
                      )
                    }
                    value={applicationSettingsForm.values.content}
                  />
                </div>
              </div>

              <p
                aria-live="polite"
                className={cn(
                  styles.hint,
                  applicationSettingsForm.error && styles.errorText,
                  applicationSettingsForm.successMessage && styles.successText,
                )}
                role={applicationSettingsForm.error ? "alert" : undefined}
              >
                {applicationSettingsForm.error ??
                  applicationSettingsForm.successMessage ??
                  applicationSettingsValidationMessage ??
                  "Usá este guardado para probar la persistencia de la configuración."}
              </p>

              <div className={styles.actions}>
                <Button
                  disabled={
                    !isOAuthConfigured ||
                    !isAuthenticated ||
                    isSessionLoading ||
                    applicationSettingsForm.isSubmitting ||
                    Boolean(applicationSettingsValidationMessage)
                  }
                  type="submit"
                >
                  {applicationSettingsForm.isSubmitting
                    ? "Guardando configuración..."
                    : "Guardar configuración"}
                </Button>
              </div>

              {applicationSettingsForm.result ? (
                <div className={styles.result}>
                  <p className={styles.resultLine}>
                    Nombre: {applicationSettingsForm.result.name}
                  </p>
                  <p className={styles.resultLine}>
                    MIME type: {applicationSettingsForm.result.mimeType}
                  </p>
                  <p className={styles.resultLine}>
                    Id: {applicationSettingsForm.result.id}
                  </p>
                </div>
              ) : null}
            </form>

            <form className={styles.formCard} onSubmit={submitUserFile}>
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>Guardar archivo del usuario</h3>
                <p className={styles.formDescription}>
                  Este formulario crea un archivo visible en My Drive con el
                  alcance mínimo `drive.file`.
                </p>
              </div>

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="user-file-name">
                    Nombre del archivo del usuario
                  </label>
                  <input
                    className={styles.input}
                    id="user-file-name"
                    onChange={(event) =>
                      updateUserFilesField("name", event.target.value)
                    }
                    type="text"
                    value={userFilesForm.values.name}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="user-file-mime-type">
                    MIME type del archivo
                  </label>
                  <input
                    className={styles.input}
                    id="user-file-mime-type"
                    onChange={(event) =>
                      updateUserFilesField("mimeType", event.target.value)
                    }
                    type="text"
                    value={userFilesForm.values.mimeType}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="user-file-content">
                    Contenido del archivo
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="user-file-content"
                    onChange={(event) =>
                      updateUserFilesField("content", event.target.value)
                    }
                    value={userFilesForm.values.content}
                  />
                </div>
              </div>

              <p
                aria-live="polite"
                className={cn(
                  styles.hint,
                  userFilesForm.error && styles.errorText,
                  userFilesForm.successMessage && styles.successText,
                )}
                role={userFilesForm.error ? "alert" : undefined}
              >
                {userFilesForm.error ??
                  userFilesForm.successMessage ??
                  userFilesValidationMessage ??
                  "Usá este guardado para probar archivos visibles del usuario."}
              </p>

              <div className={styles.actions}>
                <Button
                  disabled={
                    !isOAuthConfigured ||
                    !isAuthenticated ||
                    isSessionLoading ||
                    userFilesForm.isSubmitting ||
                    Boolean(userFilesValidationMessage)
                  }
                  type="submit"
                >
                  {userFilesForm.isSubmitting
                    ? "Guardando archivo..."
                    : "Guardar archivo"}
                </Button>
              </div>

              {userFilesForm.result ? (
                <div className={styles.result}>
                  <p className={styles.resultLine}>
                    Nombre: {userFilesForm.result.name}
                  </p>
                  <p className={styles.resultLine}>
                    MIME type: {userFilesForm.result.mimeType}
                  </p>
                  <p className={styles.resultLine}>Id: {userFilesForm.result.id}</p>
                  {userFilesForm.result.viewUrl ? (
                    <Button asChild className={styles.resultLink} variant="link">
                      <a
                        href={userFilesForm.result.viewUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Abrir archivo en Drive
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </form>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
