/**
 * Shared data shapes for the monthly expenses table feature. These types are the
 * vocabulary that the table component, its cells, and its pure helpers all speak,
 * so they live in a dependency-free module to avoid coupling helpers to the
 * component file.
 */

export type TechnicalErrorCode = `E${number}${number}${number}${number}`;

export type MonthlyExpenseCurrency = "ARS" | "USD";

export type MonthlyExpenseLoanDirection = "payable" | "receivable";

export type MonthlyExpenseSubtotalUnit = "occurrence" | "hour";

export type MonthlyExpenseReceiptShareStatus = "pending" | "sent";

/** Base dollar quote for a USD expense: informal, official or a manual rate. */
export type MonthlyExpenseUsdRateBase = "blue" | "official" | "custom";

/**
 * Per-expense USD→ARS conversion settings: a base quote plus optional
 * surcharges (IIBB perception and 21% VAT) stacked on top.
 */
export interface MonthlyExpenseUsdRateSettings {
  appliesIibb: boolean;
  appliesIva: boolean;
  base: MonthlyExpenseUsdRateBase;
  /** Manual ARS-per-USD rate, only meaningful when `base` is `custom`. */
  customRate: number | null;
}

/** Historical default: official quote with the IIBB perception (solidario). */
export const DEFAULT_USD_RATE_SETTINGS: MonthlyExpenseUsdRateSettings = {
  appliesIibb: true,
  appliesIva: false,
  base: "official",
  customRate: null,
};

/** VAT surcharge factor applied when `appliesIva` is on. */
export const USD_RATE_IVA_FACTOR = 1.21;

/** Row grouping mode for the monthly expenses table. */
export type MonthlyExpensesGroupByMode =
  | "none"
  | "folder"
  | "lender"
  | "lenderType"
  | "currency"
  | "direction"
  | "paymentStatus"
  | "recurrence"
  | "vigencia";

/** Sort criterion for the unified loan "Deuda / cuotas" column. */
export type LoanSortMode =
  | "paidInstallments"
  | "remainingInstallments"
  | "totalInstallments";

/** Sort criterion for the unified loan "Vigencia" column (start vs end month). */
export type VigenciaSortMode = "startMonth" | "endMonth";

export type MonthlyExpenseDriveResourceStatus =
  | "normal"
  | "trashed"
  | "missing";

/** Historical exchange-rate snapshot used to convert amounts into ARS. */
export interface ExchangeRateSnapshot {
  blueRate: number;
  month: string;
  officialRate: number;
  solidarityRate: number;
}

export interface MonthlyExpensesEditableReceipt {
  allReceiptsFolderId: string;
  allReceiptsFolderStatus?: MonthlyExpenseDriveResourceStatus;
  allReceiptsFolderViewUrl: string;
  coveredPayments: number;
  fileId: string;
  fileName: string;
  fileStatus?: MonthlyExpenseDriveResourceStatus;
  fileViewUrl: string;
  monthlyFolderId: string;
  monthlyFolderStatus?: MonthlyExpenseDriveResourceStatus;
  monthlyFolderViewUrl: string;
}

export interface MonthlyExpensesEditablePaymentRecord {
  coveredPayments: number;
  id: string;
  receipt?: MonthlyExpensesEditableReceipt;
  registeredAt: string | null;
  sendStatus?: MonthlyExpenseReceiptShareStatus;
}

export interface MonthlyExpensesEditableRow {
  allReceiptsFolderId: string;
  allReceiptsFolderStatus?: MonthlyExpenseDriveResourceStatus;
  allReceiptsFolderViewUrl: string;
  currency: MonthlyExpenseCurrency;
  description: string;
  expenseFolderId: string;
  id: string;
  installmentCount: string;
  isLoan: boolean;
  lenderId: string;
  lenderName: string;
  loanDirection?: MonthlyExpenseLoanDirection;
  loanEndMonth: string;
  loanPaidInstallments: number | null;
  loanProgress: string;
  loanRemainingInstallments: number | null;
  loanTotalInstallments: number | null;
  manualCoveredPayments: string;
  occurrencesPerMonth: string;
  occurrencesUnit: string;
  /** Whether the expense is an open-ended recurring expense (rent, utilities, etc.). */
  isRecurring: boolean;
  /** First month (`YYYY-MM`) the recurring expense applies to. */
  recurrenceStartMonth: string;
  /**
   * Last month (`YYYY-MM`) the recurring expense applies to. Empty while the
   * recurrence is active/open-ended; set to cancel it from that month onward.
   */
  recurrenceEndMonth: string;
  /** Whether the recurrence is active in the visible month (derived for display). */
  recurrenceIsActive: boolean;
  paymentRecords?: MonthlyExpensesEditablePaymentRecord[];
  paymentLink: string;
  receiptShareMessage: string;
  receiptSharePhoneDigits: string;
  requiresReceiptShare: boolean;
  receipts: MonthlyExpensesEditableReceipt[];
  monthlyFolderId: string;
  monthlyFolderStatus?: MonthlyExpenseDriveResourceStatus;
  monthlyFolderViewUrl: string;
  sortOrder: number | null;
  startMonth: string;
  subtotal: string;
  subtotalUnit?: MonthlyExpenseSubtotalUnit;
  total: string;
  usdRate: MonthlyExpenseUsdRateSettings;
}

export interface MonthlyExpensesReplicableOption {
  description: string;
  id: string;
}
