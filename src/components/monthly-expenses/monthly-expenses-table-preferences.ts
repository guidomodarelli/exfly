import type { SortingState, VisibilityState } from "@tanstack/react-table";

import {
  GROUP_POSITION_COLUMN_ID,
  LOAN_INSTALLMENT_RANGE_COLUMN_ID,
  LOAN_SORT_COLUMN_ID,
} from "./monthly-expenses-table-column-ids";
import type {
  LoanSortMode,
  MonthlyExpensesGroupByMode,
  VigenciaSortMode,
} from "./monthly-expenses-table.types";

const MONTHLY_EXPENSES_TABLE_PREFERENCES_STORAGE_KEY =
  "control-mensual.monthly-expenses.table-preferences";

export const DEFAULT_LOAN_SORT_MODE: LoanSortMode = "paidInstallments";

export const DEFAULT_VIGENCIA_SORT_MODE: VigenciaSortMode = "startMonth";

export const DEFAULT_MOVE_COMPLETED_TO_END = true;

export const DEFAULT_GROUP_BY_MODE: MonthlyExpensesGroupByMode = "none";

export const MONTHLY_EXPENSES_DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  // Columna fantasma del agrupado: nunca se muestra ni se puede mostrar.
  [GROUP_POSITION_COLUMN_ID]: false,
  // Registros vive unificado dentro de la columna Pagos; la columna queda
  // oculta solo como soporte de orden y filtros.
  paymentHistory: false,
  usd: false,
};

// Column ids accepted when restoring persisted sorting/visibility.
// `paymentHistory` no se acepta: dejó de ser ordenable al unificarse en "Pagos"
// y un orden viejo persistido no tendría forma visible de quitarse.
const SORTABLE_COLUMN_IDS = new Set([
  "description",
  "paymentsProgress",
  "subtotal",
  "total",
  "usd",
  LOAN_SORT_COLUMN_ID,
  "lenderName",
  LOAN_INSTALLMENT_RANGE_COLUMN_ID,
]);

// `paymentHistory` no se acepta: quedó unificada dentro de "Pagos" y una
// preferencia vieja persistida no debe volver a mostrarla.
const PERSISTABLE_COLUMN_VISIBILITY_IDS = new Set([
  "paymentsProgress",
  "subtotal",
  "total",
  "usd",
  LOAN_SORT_COLUMN_ID,
  "lenderName",
  LOAN_INSTALLMENT_RANGE_COLUMN_ID,
]);

export interface MonthlyExpensesTablePreferences {
  /** Group keys the user collapsed; only meaningful while grouping is on. */
  collapsedGroupKeys: string[];
  columnVisibility: VisibilityState;
  groupByMode: MonthlyExpensesGroupByMode;
  loanSortMode: LoanSortMode;
  moveCompletedToEnd: boolean;
  sorting: SortingState;
  vigenciaSortMode: VigenciaSortMode;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePersistedLoanSortMode(value: unknown): LoanSortMode | null {
  if (
    value !== "paidInstallments" &&
    value !== "remainingInstallments" &&
    value !== "totalInstallments"
  ) {
    return null;
  }

  return value;
}

function parsePersistedVigenciaSortMode(
  value: unknown,
): VigenciaSortMode | null {
  if (value !== "startMonth" && value !== "endMonth") {
    return null;
  }

  return value;
}

const PERSISTABLE_GROUP_BY_MODES: ReadonlySet<MonthlyExpensesGroupByMode> =
  new Set(["none", "folder", "lender", "currency", "direction", "paymentStatus"]);

function parsePersistedGroupByMode(
  value: unknown,
): MonthlyExpensesGroupByMode {
  return typeof value === "string" &&
    PERSISTABLE_GROUP_BY_MODES.has(value as MonthlyExpensesGroupByMode)
    ? (value as MonthlyExpensesGroupByMode)
    : DEFAULT_GROUP_BY_MODE;
}

function parsePersistedCollapsedGroupKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (groupKey): groupKey is string => typeof groupKey === "string",
  );
}

function parsePersistedMoveCompletedToEnd(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return DEFAULT_MOVE_COMPLETED_TO_END;
}

function parsePersistedSorting(value: unknown): SortingState | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedSorting: SortingState = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const id = entry.id;
    const desc = entry.desc;

    if (
      typeof id !== "string" ||
      typeof desc !== "boolean" ||
      !SORTABLE_COLUMN_IDS.has(id)
    ) {
      continue;
    }

    parsedSorting.push({
      desc,
      id,
    });
  }

  return parsedSorting;
}

function parsePersistedColumnVisibility(value: unknown): VisibilityState | null {
  if (!isRecord(value)) {
    return null;
  }

  const parsedColumnVisibility: VisibilityState = {};

  for (const [columnId, isVisible] of Object.entries(value)) {
    if (
      !PERSISTABLE_COLUMN_VISIBILITY_IDS.has(columnId) ||
      typeof isVisible !== "boolean"
    ) {
      continue;
    }

    parsedColumnVisibility[columnId] = isVisible;
  }

  return parsedColumnVisibility;
}

/**
 * Reads and validates the persisted table preferences from localStorage,
 * falling back to defaults for any missing or malformed field.
 *
 * @returns The restored preferences, or `null` on the server or when nothing
 *   valid is stored.
 */
export function getPersistedMonthlyExpensesTablePreferences(): MonthlyExpensesTablePreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const serializedPreferences = window.localStorage.getItem(
      MONTHLY_EXPENSES_TABLE_PREFERENCES_STORAGE_KEY,
    );

    if (!serializedPreferences) {
      return null;
    }

    const parsedPreferences = JSON.parse(serializedPreferences);

    if (!isRecord(parsedPreferences)) {
      return null;
    }

    const loanSortMode =
      parsePersistedLoanSortMode(parsedPreferences.loanSortMode) ??
      DEFAULT_LOAN_SORT_MODE;
    const vigenciaSortMode =
      parsePersistedVigenciaSortMode(parsedPreferences.vigenciaSortMode) ??
      DEFAULT_VIGENCIA_SORT_MODE;
    const moveCompletedToEnd = parsePersistedMoveCompletedToEnd(
      parsedPreferences.moveCompletedToEnd,
    );
    const sorting = parsePersistedSorting(parsedPreferences.sorting) ?? [];
    const parsedColumnVisibility =
      parsePersistedColumnVisibility(parsedPreferences.columnVisibility) ?? {};
    const columnVisibility: VisibilityState = {
      ...MONTHLY_EXPENSES_DEFAULT_COLUMN_VISIBILITY,
      ...parsedColumnVisibility,
    };

    return {
      collapsedGroupKeys: parsePersistedCollapsedGroupKeys(
        parsedPreferences.collapsedGroupKeys,
      ),
      columnVisibility,
      groupByMode: parsePersistedGroupByMode(parsedPreferences.groupByMode),
      loanSortMode,
      moveCompletedToEnd,
      sorting,
      vigenciaSortMode,
    };
  } catch {
    return null;
  }
}

/**
 * Persists the given table preferences to localStorage, silently ignoring
 * storage failures (private mode, disabled storage, etc.).
 */
export function persistMonthlyExpensesTablePreferences(
  preferences: MonthlyExpensesTablePreferences,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      MONTHLY_EXPENSES_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Ignore storage failures (private mode, disabled storage, etc.)
  }
}
