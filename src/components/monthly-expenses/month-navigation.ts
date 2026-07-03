const YEAR_MONTH_NAVIGATION_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/**
 * Returns the `YYYY-MM` value that is `monthOffset` months away from the given
 * one, or `null` when the input is not a valid `YYYY-MM` string.
 */
export function getAdjacentYearMonth(
  yearMonth: string,
  monthOffset: number,
): string | null {
  const match = YEAR_MONTH_NAVIGATION_PATTERN.exec(yearMonth.trim());

  if (!match) {
    return null;
  }

  const [, yearValue, monthValue] = match;
  const zeroBasedMonthIndex =
    Number(yearValue) * 12 + (Number(monthValue) - 1) + monthOffset;

  if (zeroBasedMonthIndex < 0) {
    return null;
  }

  const adjacentYear = Math.floor(zeroBasedMonthIndex / 12);
  const adjacentMonth = (zeroBasedMonthIndex % 12) + 1;

  return `${String(adjacentYear).padStart(4, "0")}-${String(adjacentMonth).padStart(2, "0")}`;
}

/**
 * Formats the reference date (defaults to now) as a local-time `YYYY-MM`
 * value, matching the format used by the month input.
 */
export function getCurrentYearMonth(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}
