import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";

import { StoragePlayground } from "./storage-playground";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockedUseSession = jest.mocked(useSession);
const originalFetch = global.fetch;

describe("StoragePlayground", () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({
      data: {
        expires: "2099-01-01T00:00:00.000Z",
        user: {
          email: "gus@example.com",
          name: "Gus",
        },
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("disables storage actions when there is no Google session", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    render(<StoragePlayground isOAuthConfigured />);

    expect(
      screen.getByText("Conectate con Google para habilitar el guardado en Drive."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar configuración" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Guardar archivo" }),
    ).toBeDisabled();
  });

  it("shows the active account personal details when session is authenticated", () => {
    render(<StoragePlayground isOAuthConfigured />);

    expect(
      screen.getByText("Sesión Google activa. Ya podés guardar en Drive."),
    ).toBeInTheDocument();
    expect(screen.getByText("Cuenta activa: Gus")).toBeInTheDocument();
    expect(screen.getByText("Email: gus@example.com")).toBeInTheDocument();
  });

  it("saves application settings and shows the created file id", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({
        data: {
          id: "settings-file-id",
          mimeType: "application/json",
          name: "application-settings.json",
        },
      }),
      ok: true,
    });
    global.fetch = fetchMock as typeof fetch;

    render(<StoragePlayground isOAuthConfigured />);

    await user.click(
      screen.getByRole("button", { name: "Guardar configuración" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/storage/application-settings",
        expect.objectContaining({
          body: JSON.stringify({
            content: "{\n  \"theme\": \"dark\"\n}",
            mimeType: "application/json",
            name: "application-settings.json",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
      );
    });

    expect(
      screen.getByText("Configuración guardada en Drive con id settings-file-id."),
    ).toBeInTheDocument();
  });

  it("saves a user file and renders the Drive link", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({
        data: {
          id: "user-file-id",
          mimeType: "text/csv",
          name: "expenses.csv",
          viewUrl: "https://drive.google.com/file/d/user-file-id/view",
        },
      }),
      ok: true,
    });
    global.fetch = fetchMock as typeof fetch;

    render(<StoragePlayground isOAuthConfigured />);

    await user.click(screen.getByRole("button", { name: "Guardar archivo" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/storage/user-files",
        expect.objectContaining({
          body: JSON.stringify({
            content: "date,amount\n2026-03-08,32.5",
            mimeType: "text/csv",
            name: "expenses.csv",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
      );
    });

    expect(
      screen.getByText("Archivo guardado en Drive con id user-file-id."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir archivo en Drive" }),
    ).toHaveAttribute(
      "href",
      "https://drive.google.com/file/d/user-file-id/view",
    );
  });

  it("shows inline validation when the user file content is empty", async () => {
    const user = userEvent.setup();

    render(<StoragePlayground isOAuthConfigured />);

    await user.clear(screen.getByLabelText("Contenido del archivo"));

    expect(
      screen.getByText(
        "Completá nombre, MIME type y contenido para guardar el archivo del usuario.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar archivo" }),
    ).toBeDisabled();
  });
});
