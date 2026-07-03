export const MONTHLY_EXPENSES_FILTER_PRESETS_STORAGE_KEY =
  "control-mensual.monthly-expenses.filter-presets";

/** A named, reusable query for the unified filter bar. */
export interface MonthlyExpensesFilterPreset {
  name: string;
  query: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePersistedFilterPreset(
  value: unknown,
): MonthlyExpensesFilterPreset | null {
  if (!isRecord(value)) {
    return null;
  }

  const { name, query } = value;

  if (typeof name !== "string" || typeof query !== "string") {
    return null;
  }

  const normalizedName = name.trim();
  const normalizedQuery = query.trim();

  if (!normalizedName || !normalizedQuery) {
    return null;
  }

  return { name: normalizedName, query: normalizedQuery };
}

/**
 * Reads and validates the persisted filter presets from localStorage, dropping
 * malformed entries.
 *
 * @returns The restored presets, or an empty list on the server or when
 *   nothing valid is stored.
 */
export function getPersistedMonthlyExpensesFilterPresets(): MonthlyExpensesFilterPreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const serializedPresets = window.localStorage.getItem(
      MONTHLY_EXPENSES_FILTER_PRESETS_STORAGE_KEY,
    );

    if (!serializedPresets) {
      return [];
    }

    const parsedPresets = JSON.parse(serializedPresets);

    if (!Array.isArray(parsedPresets)) {
      return [];
    }

    return parsedPresets
      .map((entry) => parsePersistedFilterPreset(entry))
      .filter(
        (preset): preset is MonthlyExpensesFilterPreset => preset !== null,
      );
  } catch {
    return [];
  }
}

/**
 * Persists the given filter presets to localStorage, silently ignoring
 * storage failures (private mode, disabled storage, etc.).
 */
export function persistMonthlyExpensesFilterPresets(
  presets: MonthlyExpensesFilterPreset[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      MONTHLY_EXPENSES_FILTER_PRESETS_STORAGE_KEY,
      JSON.stringify(presets),
    );
  } catch {
    // Ignore storage failures (private mode, disabled storage, etc.)
  }
}
