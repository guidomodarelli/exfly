import type { MonthlyExpensesPageProps } from "@/modules/monthly-expenses/shared/pages/monthly-expenses-page";

import {
  toSerializableMonthlyExpensesPageProps,
} from "./monthly-expenses-server-props";

describe("toSerializableMonthlyExpensesPageProps", () => {
  it("omits undefined nested folder status values from the SSR payload", () => {
    const props: MonthlyExpensesPageProps = {
      bootstrap: {
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
        ],
        storageTargets: [
          {
            id: "userFiles",
            requiredScope: "https://www.googleapis.com/auth/drive.file",
            writesUserVisibleFiles: true,
          },
        ],
      },
      initialActiveTab: "expenses",
      initialCopyableMonths: {
        defaultSourceMonth: null,
        sourceMonths: [],
        targetMonth: "2026-04",
      },
      initialDocument: {
        items: [
          {
            currency: "ARS",
            description: "Internet",
            folders: {
              allReceiptsFolderId: "folder-all",
              allReceiptsFolderStatus: "normal",
              allReceiptsFolderViewUrl: "https://example.com/all",
              monthlyFolderId: "folder-monthly",
              monthlyFolderStatus: undefined,
              monthlyFolderViewUrl: "https://example.com/monthly",
            },
            id: "expense-1",
            occurrencesPerMonth: 1,
            receipts: [],
            subtotal: 100,
            total: 100,
          },
        ],
        month: "2026-04",
      },
      initialLendersCatalog: {
        lenders: [],
      },
      initialLoansReport: {
        entries: [],
        summary: {
          activeLoanCount: 0,
          lenderCount: 0,
          remainingAmount: 0,
          trackedLoanCount: 0,
        },
      },
      initialSidebarOpen: false,
      lendersLoadError: null,
      loadError: null,
      reportLoadError: null,
    };

    const serializedProps = toSerializableMonthlyExpensesPageProps(props);
    const itemFolders = serializedProps.initialDocument.items[0]?.folders;

    expect(itemFolders).toEqual({
      allReceiptsFolderId: "folder-all",
      allReceiptsFolderStatus: "normal",
      allReceiptsFolderViewUrl: "https://example.com/all",
      monthlyFolderId: "folder-monthly",
      monthlyFolderViewUrl: "https://example.com/monthly",
    });
    expect(itemFolders).not.toHaveProperty("monthlyFolderStatus");
  });
});
