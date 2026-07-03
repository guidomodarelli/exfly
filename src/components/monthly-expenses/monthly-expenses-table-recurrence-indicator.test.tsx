import { screen } from "@testing-library/react";

import {
  createRow,
  renderMonthlyExpensesTable,
} from "./monthly-expenses-table-test-utils";

describe("MonthlyExpensesTable recurrence indicator", () => {
  it("shows an accessible recurring icon next to the description of an active recurring expense", () => {
    renderMonthlyExpensesTable([
      createRow({
        description: "Alquiler",
        id: "expense-1",
        isRecurring: true,
        recurrenceEndMonth: "",
      }),
    ]);

    expect(screen.getByLabelText("Gasto recurrente")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recurrencia cancelada"),
    ).not.toBeInTheDocument();
  });

  it("shows a muted cancelled indicator when the recurrence has an end month", () => {
    renderMonthlyExpensesTable([
      createRow({
        description: "Gimnasio",
        id: "expense-1",
        isRecurring: true,
        recurrenceEndMonth: "2026-04",
      }),
    ]);

    expect(
      screen.getByLabelText("Recurrencia cancelada"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Gasto recurrente"),
    ).not.toBeInTheDocument();
  });

  it("renders no recurrence indicator for one-off expenses", () => {
    renderMonthlyExpensesTable([
      createRow({
        description: "Compra única",
        id: "expense-1",
        isRecurring: false,
      }),
    ]);

    expect(
      screen.queryByLabelText("Gasto recurrente"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recurrencia cancelada"),
    ).not.toBeInTheDocument();
  });
});
