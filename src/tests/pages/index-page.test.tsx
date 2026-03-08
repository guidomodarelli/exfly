import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";

import HomePage from "@/pages/index";
import type { StorageBootstrap } from "@/server/storage/get-storage-bootstrap";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockedUseSession = jest.mocked(useSession);

const bootstrap: StorageBootstrap = {
  architecture: {
    dataStrategy: "ssr-first",
    middleendLocation: "src/modules",
    routing: "pages-router",
  },
  authStatus: "configured",
  requiredScopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appdata",
  ],
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

describe("HomePage", () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);
  });

  it("renders the Google Drive bootstrap overview", () => {
    render(<HomePage bootstrap={bootstrap} hasBootstrapError={false} />);

    expect(
      screen.getByRole("heading", { name: "Mis Finanzas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Conectar Google" }),
    ).toHaveAttribute("href", "/auth/signin");
    expect(
      screen.getByText("https://www.googleapis.com/auth/drive.appdata"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Probar storage en Google Drive" }),
    ).toBeInTheDocument();
  });

  it("renders a safe fallback message when bootstrap fails", () => {
    render(<HomePage bootstrap={bootstrap} hasBootstrapError />);

    expect(
      screen.getByText(
        "No pudimos preparar la configuración inicial de Google Drive. Reintentá más tarde.",
      ),
    ).toBeInTheDocument();
  });
});
