import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import MonthlyExpensesPage from "@/modules/monthly-expenses/shared/pages/monthly-expenses-page";
import { selectDropdownSubmenuItem } from "@/tests/utils/radix-menu-test-helpers";

import {
  basePageProps,
  createMockRouter,
  createMonthlyExpensesFetchMock,
  registerMonthlyExpensesPageDefaultHooks,
  renderWithProviders,
} from "./monthly-expenses-page-test-helpers";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

jest.mock("sonner", () => {
  const mockToast = Object.assign(jest.fn(), {
    error: jest.fn(),
    info: jest.fn(),
    promise: jest.fn((promise: Promise<unknown>) => promise.catch(() => undefined)),
    success: jest.fn(),
    warning: jest.fn(),
  });

  return {
    toast: mockToast,
  };
});

type MockedToast = jest.Mock & {
  error: jest.Mock;
  info: jest.Mock;
  promise: jest.Mock;
  success: jest.Mock;
  warning: jest.Mock;
};

const mockedUsePathname = jest.mocked(usePathname);
const mockedUseRouter = jest.mocked(useRouter);
const mockedUseSearchParams = jest.mocked(useSearchParams);
const mockedUseSession = jest.mocked(useSession);
const mockedSignIn = jest.mocked(signIn);
const mockedSignOut = jest.mocked(signOut);
const mockedToast = toast as unknown as MockedToast;
const originalFetch = global.fetch;

const INITIAL_DOCUMENT = {
  items: [
    {
      currency: "ARS" as const,
      description: "Internet",
      id: "expense-1",
      occurrencesPerMonth: 1,
      subtotal: 1000,
      total: 1000,
    },
  ],
  month: "2026-03",
};

function authenticateSession() {
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
}

describe("MonthlyExpensesPage duplicate into another month", () => {
  registerMonthlyExpensesPageDefaultHooks({
    createDefaultRouter: () => createMockRouter(),
    mockedUsePathname,
    mockedSignIn,
    mockedSignOut,
    mockedToast,
    mockedUseRouter,
    mockedUseSearchParams,
    mockedUseSession,
    originalFetch,
  });

  it("loads the target month, appends the duplicate and saves it there", async () => {
    authenticateSession();

    const baseFetchMock = createMonthlyExpensesFetchMock({
      monthlyDocument: {
        items: [
          {
            currency: "ARS",
            description: "Gasto de abril",
            id: "expense-april-1",
            occurrencesPerMonth: 1,
            subtotal: 700,
            total: 700,
          },
        ],
        month: "2026-04",
      },
    });

    global.fetch = baseFetchMock as typeof fetch;
    const user = userEvent.setup();

    renderWithProviders(
      <MonthlyExpensesPage {...basePageProps} initialDocument={INITIAL_DOCUMENT} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Abrir acciones para Internet" }),
    );
    await selectDropdownSubmenuItem(user, "Duplicar", "En el mes siguiente");

    // Carga el documento del mes destino…
    await waitFor(() => {
      expect(baseFetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/storage/monthly-expenses?month=2026-04"),
        expect.anything(),
      );
    });

    // …y guarda allí el duplicado junto a lo existente, sin tocar el mes actual.
    await waitFor(() => {
      const saveCall = baseFetchMock.mock.calls.find(
        ([url]) => url === "/api/storage/monthly-expenses",
      );

      expect(saveCall).toBeDefined();
    });

    const [, saveInit] = baseFetchMock.mock.calls.find(
      ([url]) => url === "/api/storage/monthly-expenses",
    ) as [string, RequestInit];
    const payload = JSON.parse(String(saveInit.body));

    expect(payload.month).toBe("2026-04");
    expect(
      payload.items.map((item: { description: string }) => item.description),
    ).toEqual(["Gasto de abril", "Internet"]);
    // La fila actual del mes visible sigue intacta.
    expect(screen.getByText("Internet")).toBeInTheDocument();
    expect(mockedToast.promise).toHaveBeenCalled();
  });
});
