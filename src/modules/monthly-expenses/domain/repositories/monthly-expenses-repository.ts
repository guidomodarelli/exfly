import type { StoredMonthlyExpensesDocument } from "../entities/stored-monthly-expenses-document";
import type { MonthlyExpensesDocument } from "../value-objects/monthly-expenses-document";

export interface MonthlyExpensesRepository {
  getByMonth(month: string): Promise<MonthlyExpensesDocument | null>;
  getOldestStoredMonth?(): Promise<string | null>;
  listAll(): Promise<MonthlyExpensesDocument[]>;
  listMonthsWithExpenses?(): Promise<string[]>;
  /**
   * Rewrites the frozen solidario of already-stored documents for `month` when
   * the month's IIBB changes. Each affected row recomputes its solidario from
   * its own frozen official rate: `official × solidarityMultiplier`, where the
   * caller supplies `solidarityMultiplier = 1 + IIBB + IVA` (the solidario
   * formula stays owned by the exchange-rates module). Rows without a frozen
   * official rate are left untouched.
   */
  refreshExchangeRateSolidarityForMonth?(input: {
    month: string;
    solidarityMultiplier: number;
  }): Promise<void>;
  save(
    document: MonthlyExpensesDocument,
  ): Promise<StoredMonthlyExpensesDocument>;
}
