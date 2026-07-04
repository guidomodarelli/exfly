import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import MonthlyExpensesPage from "@/modules/monthly-expenses/shared/pages/monthly-expenses-page";

import {
  basePageProps,
  createMockRouter,
  createMonthlyExpensesFetchMock,
  getMonthlyExpensesTable,
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
    promise: jest.fn((promise: Promise<unknown>) => promise),
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

function getTableTextNormalized(): string {
  return (getMonthlyExpensesTable()?.textContent ?? "").replace(/\s/g, " ");
}

function getSaveCalls(fetchMock: jest.Mock) {
  return fetchMock.mock.calls.filter(
    ([url]) => url === "/api/storage/monthly-expenses",
  );
}

async function saveSubtotalFromDetailsDialog(
  user: ReturnType<typeof userEvent.setup>,
  nextSubtotal: string,
) {
  await user.click(
    screen.getByRole("button", {
      name: "Abrir acciones de subtotal y cantidad para Internet",
    }),
  );
  await user.click(
    await screen.findByRole("menuitem", { name: "Editar subtotal y cantidad" }),
  );

  const subtotalInput = await screen.findByLabelText("Subtotal");

  await user.clear(subtotalInput);
  await user.type(subtotalInput, nextSubtotal);
  await user.click(screen.getByRole("button", { name: "Guardar" }));
}

describe("MonthlyExpensesPage optimistic expense details", () => {
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

  it("closes the dialog and shows the new total before the save resolves", async () => {
    authenticateSession();

    const baseFetchMock = createMonthlyExpensesFetchMock();
    const deferredSave: { resolve: (() => void) | null } = { resolve: null };
    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (input === "/api/storage/monthly-expenses") {
          await new Promise<void>((resolveSave) => {
            deferredSave.resolve = resolveSave;
          });

          return { ok: true, status: 204 };
        }

        return baseFetchMock(input, init);
      },
    );

    global.fetch = fetchMock as unknown as typeof fetch;
    const user = userEvent.setup();

    renderWithProviders(
      <MonthlyExpensesPage {...basePageProps} initialDocument={INITIAL_DOCUMENT} />,
    );

    await saveSubtotalFromDetailsDialog(user, "2500");

    // Feedback inmediato: el dialog se cierra y el total nuevo ya se ve,
    // aunque el POST siga en vuelo.
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Editar subtotal y cantidad" }),
      ).not.toBeInTheDocument();
    });
    expect(getTableTextNormalized()).toContain("2.500");

    deferredSave.resolve?.();

    await waitFor(() => {
      expect(getSaveCalls(fetchMock)).toHaveLength(1);
    });

    const [, requestInit] = getSaveCalls(fetchMock)[0] as [string, RequestInit];
    const payload = JSON.parse(String(requestInit.body));

    expect(payload.items[0].subtotal).toBe(2500);
  });

  it("queues a second edit while the first save is in flight", async () => {
    authenticateSession();

    const baseFetchMock = createMonthlyExpensesFetchMock();
    const deferredFirstSave: { resolve: (() => void) | null } = {
      resolve: null,
    };
    let saveCallCount = 0;
    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (input === "/api/storage/monthly-expenses") {
          saveCallCount += 1;

          if (saveCallCount === 1) {
            await new Promise<void>((resolveFirstSave) => {
              deferredFirstSave.resolve = resolveFirstSave;
            });
          }

          return { ok: true, status: 204 };
        }

        return baseFetchMock(input, init);
      },
    );

    global.fetch = fetchMock as unknown as typeof fetch;
    const user = userEvent.setup();

    renderWithProviders(
      <MonthlyExpensesPage {...basePageProps} initialDocument={INITIAL_DOCUMENT} />,
    );

    await saveSubtotalFromDetailsDialog(user, "2500");

    await waitFor(() => {
      expect(getSaveCalls(fetchMock)).toHaveLength(1);
    });

    // Con el primer guardado en vuelo, el usuario edita de nuevo.
    await saveSubtotalFromDetailsDialog(user, "4000");
    expect(getTableTextNormalized()).toContain("4.000");

    deferredFirstSave.resolve?.();

    // La intención más nueva sale en un segundo request y la UI la conserva.
    await waitFor(() => {
      expect(getSaveCalls(fetchMock)).toHaveLength(2);
    });

    const [, secondRequestInit] = getSaveCalls(fetchMock)[1] as [
      string,
      RequestInit,
    ];
    const secondPayload = JSON.parse(String(secondRequestInit.body));

    expect(secondPayload.items[0].subtotal).toBe(4000);
    await waitFor(() => {
      expect(getTableTextNormalized()).toContain("4.000");
    });
  });

  it("rolls back to the baseline values when the save fails", async () => {
    authenticateSession();

    const baseFetchMock = createMonthlyExpensesFetchMock();
    const deferredFailure: { resolve: (() => void) | null } = { resolve: null };
    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (input === "/api/storage/monthly-expenses") {
          // El fallo se libera desde el test para poder observar el estado
          // optimista mientras el request está en vuelo.
          await new Promise<void>((resolveFailure) => {
            deferredFailure.resolve = resolveFailure;
          });

          return {
            json: async () => ({ error: "boom" }),
            ok: false,
            status: 500,
          };
        }

        return baseFetchMock(input, init);
      },
    );

    global.fetch = fetchMock as unknown as typeof fetch;
    const user = userEvent.setup();

    renderWithProviders(
      <MonthlyExpensesPage {...basePageProps} initialDocument={INITIAL_DOCUMENT} />,
    );

    await saveSubtotalFromDetailsDialog(user, "2500");

    await waitFor(() => {
      expect(getSaveCalls(fetchMock)).toHaveLength(1);
    });
    expect(getTableTextNormalized()).toContain("2.500");

    deferredFailure.resolve?.();

    // Rollback al baseline capturado (subtotal original) + error visible.
    await waitFor(() => {
      expect(getTableTextNormalized()).not.toContain("2.500");
    });
    expect(getTableTextNormalized()).toContain("1.000");
    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "No pudimos actualizar el gasto.",
      );
    });
  });
});
