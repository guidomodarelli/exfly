import {
  calculateLoanEndMonth,
  calculatePaidLoanInstallments,
} from "../../domain/value-objects/monthly-expenses-document";

export interface MonthlyExpenseLoanPreview {
  endMonth: string;
  paidInstallments: number;
}

export function getMonthlyExpenseLoanPreview({
  installmentCount,
  startMonth,
  targetMonth,
}: {
  installmentCount: number;
  startMonth: string;
  targetMonth: string;
}): MonthlyExpenseLoanPreview {
  return {
    endMonth: calculateLoanEndMonth({
      installmentCount,
      startMonth,
    }),
    paidInstallments: calculatePaidLoanInstallments({
      installmentCount,
      startMonth,
      targetMonth,
    }),
  };
}
