import type { GetServerSidePropsContext } from "next";

import { isGoogleOAuthConfigured } from "@/modules/auth/infrastructure/oauth/google-oauth-config";
import { GOOGLE_OAUTH_SCOPES } from "@/modules/auth/infrastructure/oauth/google-oauth-scopes";
import {
  createEmptyLendersCatalogDocumentResult,
} from "@/modules/lenders/application/results/lenders-catalog-document-result";
import {
  getLendersCatalog,
} from "@/modules/lenders/application/use-cases/get-lenders-catalog";
import {
  createEmptyMonthlyExpensesCopyableMonthsResult,
} from "@/modules/monthly-expenses/application/results/monthly-expenses-copyable-months-result";
import {
  createEmptyMonthlyExpensesDocumentResult,
} from "@/modules/monthly-expenses/application/results/monthly-expenses-document-result";
import {
  createEmptyMonthlyExpensesLoansReportResult,
} from "@/modules/monthly-expenses/application/results/monthly-expenses-loans-report-result";
import {
  getMonthlyExpensesCopyableMonths,
} from "@/modules/monthly-expenses/application/use-cases/get-monthly-expenses-copyable-months";
import {
  getMonthlyExpensesDocument,
} from "@/modules/monthly-expenses/application/use-cases/get-monthly-expenses-document";
import {
  getMonthlyExpensesLoansReport,
} from "@/modules/monthly-expenses/application/use-cases/get-monthly-expenses-loans-report";
import { getStorageBootstrap } from "@/modules/storage/application/queries/get-storage-bootstrap";

import type {
  MonthlyExpensesPageProps,
  MonthlyExpensesTabKey,
} from "@/modules/monthly-expenses/shared/pages/monthly-expenses-page";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SIDEBAR_STATE_COOKIE_NAME = "mis-finanzas.sidebar.open";

function getCurrentMonthIdentifier(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getRequestedMonth(queryValue: GetServerSidePropsContext["query"]["month"]) {
  const monthValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const normalizedMonth = monthValue?.trim();

  return normalizedMonth && MONTH_PATTERN.test(normalizedMonth)
    ? normalizedMonth
    : getCurrentMonthIdentifier();
}

function getRequestedSidebarOpen(cookieValue: string | undefined): boolean {
  if (cookieValue === "false") {
    return false;
  }

  if (cookieValue === "true") {
    return true;
  }

  return true;
}

export async function getMonthlyExpensesServerSidePropsForTab(
  context: GetServerSidePropsContext,
  initialActiveTab: MonthlyExpensesTabKey,
): Promise<{ props: MonthlyExpensesPageProps }> {
  const selectedMonth = getRequestedMonth(context.query.month);
  const initialSidebarOpen = getRequestedSidebarOpen(
    context.req.cookies?.[SIDEBAR_STATE_COOKIE_NAME],
  );
  const bootstrap = getStorageBootstrap({
    isGoogleOAuthConfigured: isGoogleOAuthConfigured(),
    requiredScopes: GOOGLE_OAUTH_SCOPES,
  });

  if (bootstrap.authStatus !== "configured") {
    return {
      props: {
        bootstrap,
        initialSidebarOpen,
        initialCopyableMonths:
          createEmptyMonthlyExpensesCopyableMonthsResult(selectedMonth),
        initialActiveTab,
        initialDocument: createEmptyMonthlyExpensesDocumentResult(
          selectedMonth,
        ),
        initialLendersCatalog: createEmptyLendersCatalogDocumentResult(),
        initialLoansReport: createEmptyMonthlyExpensesLoansReportResult(),
        lendersLoadError: null,
        loadError: null,
        reportLoadError: null,
      },
    };
  }

  try {
    const { getAuthenticatedUserSubjectFromRequest } = await import(
      "@/modules/auth/infrastructure/next-auth/authenticated-user-subject"
    );
    const { createMigratedTursoDatabase } = await import(
      "@/modules/shared/infrastructure/database/drizzle/turso-database"
    );
    const { DrizzleMonthlyExpensesRepository } = await import(
      "@/modules/monthly-expenses/infrastructure/turso/repositories/drizzle-monthly-expenses-repository"
    );
    const { DrizzleLendersRepository } = await import(
      "@/modules/lenders/infrastructure/turso/repositories/drizzle-lenders-repository"
    );

    const userSubject = await getAuthenticatedUserSubjectFromRequest(
      context.req,
    );
    const database = await createMigratedTursoDatabase();
    const monthlyExpensesRepository = new DrizzleMonthlyExpensesRepository(
      database,
      userSubject,
    );
    const lendersRepository = new DrizzleLendersRepository(
      database,
      userSubject,
    );

    const [documentResult, lendersResult, reportResult, copyableMonthsResult] =
      await Promise.allSettled([
        getMonthlyExpensesDocument({
          query: {
            month: selectedMonth,
          },
          repository: monthlyExpensesRepository,
        }),
        getLendersCatalog({
          repository: lendersRepository,
        }),
        getLendersCatalog({
          repository: lendersRepository,
        }).then((catalog) =>
          getMonthlyExpensesLoansReport({
            lenders: catalog.lenders,
            repository: monthlyExpensesRepository,
          }),
        ),
        getMonthlyExpensesCopyableMonths({
          query: {
            targetMonth: selectedMonth,
          },
          repository: monthlyExpensesRepository,
        }),
      ]);

    return {
      props: {
        bootstrap,
        initialSidebarOpen,
        initialCopyableMonths:
          copyableMonthsResult.status === "fulfilled"
            ? copyableMonthsResult.value
            : createEmptyMonthlyExpensesCopyableMonthsResult(selectedMonth),
        initialActiveTab,
        initialDocument:
          documentResult.status === "fulfilled"
            ? documentResult.value
            : createEmptyMonthlyExpensesDocumentResult(selectedMonth),
        initialLendersCatalog:
          lendersResult.status === "fulfilled"
            ? lendersResult.value
            : createEmptyLendersCatalogDocumentResult(),
        initialLoansReport:
          reportResult.status === "fulfilled"
            ? reportResult.value
            : createEmptyMonthlyExpensesLoansReportResult(),
        lendersLoadError:
          lendersResult.status === "rejected"
            ? "No pudimos cargar el catálogo de prestadores desde la base de datos."
            : null,
        loadError:
          documentResult.status === "rejected"
            ? "No pudimos cargar los gastos mensuales desde la base de datos. Igual podés editar la tabla y volver a guardarla."
            : null,
        reportLoadError:
          reportResult.status === "rejected"
            ? "No pudimos cargar el reporte de deudas desde la base de datos."
            : null,
      },
    };
  } catch (error) {
    return {
      props: {
        bootstrap,
        initialSidebarOpen,
        initialCopyableMonths:
          createEmptyMonthlyExpensesCopyableMonthsResult(selectedMonth),
        initialActiveTab,
        initialDocument: createEmptyMonthlyExpensesDocumentResult(
          selectedMonth,
        ),
        initialLendersCatalog: createEmptyLendersCatalogDocumentResult(),
        initialLoansReport: createEmptyMonthlyExpensesLoansReportResult(),
        lendersLoadError: null,
        loadError:
          error instanceof Error &&
          (error.name === "GoogleOAuthAuthenticationError" ||
            error.name === "GoogleOAuthConfigurationError")
            ? null
            : "No pudimos cargar los gastos mensuales desde la base de datos. Igual podés editar la tabla y volver a guardarla.",
        reportLoadError: null,
      },
    };
  }
}
