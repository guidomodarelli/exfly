import { render, screen } from "@testing-library/react";
import { StrictMode, type ComponentProps } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

import {
  MonthlyExpensesTable,
  type MonthlyExpensesEditableRow,
} from "./monthly-expenses-table";
import { DEFAULT_USD_RATE_SETTINGS } from "./monthly-expenses-table.types";

type MonthlyExpensesTableProps = ComponentProps<typeof MonthlyExpensesTable>;

/**
 * Builds a fully-populated editable expense row for table tests, allowing
 * per-test overrides of any field.
 */
export function createRow(
  overrides: Partial<MonthlyExpensesEditableRow> = {},
): MonthlyExpensesEditableRow {
  return {
    allReceiptsFolderId: "",
    allReceiptsFolderViewUrl: "",
    currency: "ARS",
    description: "Internet",
    expenseFolderId: "",
    sortOrder: null,
    id: "expense-1",
    installmentCount: "",
    isLoan: false,
    lenderId: "",
    lenderName: "",
    loanEndMonth: "",
    loanPaidInstallments: null,
    loanProgress: "",
    loanRemainingInstallments: null,
    loanTotalInstallments: null,
    manualCoveredPayments: "0",
    monthlyFolderId: "",
    monthlyFolderViewUrl: "",
    occurrencesPerMonth: "1",
    occurrencesUnit: "",
    isRecurring: false,
    recurrenceStartMonth: "",
    recurrenceEndMonth: "",
    recurrenceIsActive: false,
    paymentLink: "",
    receiptShareMessage: "",
    receiptSharePhoneDigits: "",
    requiresReceiptShare: false,
    receipts: [],
    startMonth: "",
    subtotal: "1000",
    subtotalUnit: "occurrence",
    total: "1000",
    usdRate: { ...DEFAULT_USD_RATE_SETTINGS },
    ...overrides,
  };
}

/**
 * Returns the given texts sorted by their position inside the table body, to
 * assert on-screen row/group order.
 */
export function getTableTextOrder(texts: string[]): string[] {
  const tableElement = screen.getAllByRole("table")[0];
  const content = tableElement.textContent ?? "";

  return [...texts].sort(
    (leftText, rightText) =>
      content.indexOf(leftText) - content.indexOf(rightText),
  );
}

/**
 * Renders the MonthlyExpensesTable with safe defaults for every prop so each
 * test only overrides what it exercises.
 */
export function renderMonthlyExpensesTable(
  rows: MonthlyExpensesEditableRow[],
  overrides: Partial<MonthlyExpensesTableProps> = {},
  options: {
    /**
     * Wraps the tree in React.StrictMode to reproduce the dev double-mount,
     * where mount effects run twice (needed for persistence race regressions).
     */
    strictMode?: boolean;
  } = {},
) {
  const defaultProps: MonthlyExpensesTableProps = {
    actionDisabled: false,
    changedFields: new Set(),
    draft: null,
    exchangeRateLoadError: null,
    exchangeRateSnapshot: null,
    expenseFolders: [],
    feedbackMessage: "",
    feedbackTone: "default",
    isCopyFromDisabled: false,
    isExpenseSheetOpen: false,
    isMonthTransitionPending: false,
    isSubmitting: false,
    lenders: [],
    loadError: null,
    month: "2026-04",
    onAddExpense: jest.fn(),
    onAddLender: jest.fn(),
    onCopyFromMonth: jest.fn(),
    onCopyFromMonthDialogOpenChange: jest.fn(),
    onConfirmCopyFromMonth: jest.fn(),
    onToggleAllReplicableOptions: jest.fn(),
    onToggleReplicableOption: jest.fn(),
    onDeleteAllReceiptsFolderReference: jest.fn(),
    onDeleteExpense: jest.fn(),
    onDeleteExpenses: jest.fn().mockResolvedValue(true),
    onDeleteExpenseReceiptShare: jest.fn(),
    onDeleteMonthlyFolderReference: jest.fn(),
    onDeletePaymentLink: jest.fn(),
    onDeleteReceipt: jest.fn(),
    onDeleteManualPaymentRecord: jest.fn(),
    onDuplicateExpense: jest.fn(),
    onEditExpense: jest.fn(),
    onEditManualPaymentRecord: jest.fn(),
    onEditReceiptCoverage: jest.fn(),
    onExpenseFieldChange: jest.fn(),
    onExpenseFolderSelect: jest.fn(),
    onManageFolders: jest.fn(),
    onMoveExpenseToFolder: jest.fn(),
    onMoveExpensesToFolder: jest.fn().mockResolvedValue(true),
    onReorderFolders: jest.fn(),
    onExpenseLenderSelect: jest.fn(),
    onExpenseLoanToggle: jest.fn(),
    onExpenseRecurringToggle: jest.fn(),
    onCancelRecurrence: jest.fn(),
    onReactivateRecurrence: jest.fn(),
    onExpenseReceiptShareToggle: jest.fn(),
    onMonthChange: jest.fn(),
    onRegisterPaymentRecord: jest.fn().mockResolvedValue(true),
    onRequestCloseExpenseSheet: jest.fn(),
    onSaveExpense: jest.fn(),
    onSaveUnsavedChanges: jest.fn(),
    onUnsavedChangesClose: jest.fn(),
    onUnsavedChangesDiscard: jest.fn(),
    onUpdateExpenseDetails: jest.fn(),
    onUpdateExpenseReceiptShare: jest.fn(),
    onUpdatePaymentLink: jest.fn(),
    onUpdateUsdRate: jest.fn(),
    onMarkExpensePaid: jest.fn(),
    onQuickAddExpense: jest.fn(),
    onDuplicateExpenseToMonth: jest.fn(),
    onUpdatePaymentRecordSendStatus: jest.fn(),
    pendingMonth: null,
    replicateFromPreviousMonthDialogOpen: false,
    replicateFromPreviousMonthOptions: [],
    rows,
    selectedReplicableOptionIds: [],
    sheetMode: "create",
    showCopyFromControls: false,
    showUnsavedChangesDialog: false,
    validationMessage: null,
  };
  const props: MonthlyExpensesTableProps = {
    ...defaultProps,
    ...overrides,
  };

  const tree = (
    <TooltipProvider>
      <MonthlyExpensesTable {...props} />
    </TooltipProvider>
  );

  return {
    props,
    ...render(options.strictMode ? <StrictMode>{tree}</StrictMode> : tree),
  };
}
