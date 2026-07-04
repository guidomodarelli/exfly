import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { selectDropdownSubmenuItem } from "@/tests/utils/radix-menu-test-helpers";

import {
  createRow,
  renderMonthlyExpensesTable,
} from "./monthly-expenses-table-test-utils";
import type { ExchangeRateSnapshot } from "./monthly-expenses-table.types";

const SNAPSHOT: ExchangeRateSnapshot = {
  blueRate: 1500,
  month: "2026-07",
  officialRate: 1000,
  solidarityRate: 1300,
};

function normalizeSpaces(text: string): string {
  return text.replace(/\s/g, " ");
}

describe("MonthlyExpensesTable per-expense USD rate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("offers the rate-type submenu only for USD expenses", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable([
      createRow({ currency: "USD", description: "Netflix", id: "expense-1" }),
    ]);

    await user.click(
      screen.getByRole("button", { name: "Abrir acciones para Netflix" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Tipo de cambio" }));

    for (const optionName of [
      "Oficial + IIBB",
      "Oficial",
      "Dólar blue",
      "Personalizada…",
    ]) {
      expect(
        await screen.findByRole("menuitemradio", { name: optionName }),
      ).toBeInTheDocument();
    }
  });

  it("does not offer the rate-type submenu for ARS expenses", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable([
      createRow({ currency: "ARS", description: "Alquiler", id: "expense-1" }),
    ]);

    await user.click(
      screen.getByRole("button", { name: "Abrir acciones para Alquiler" }),
    );

    expect(
      screen.queryByRole("menuitem", { name: "Tipo de cambio" }),
    ).not.toBeInTheDocument();
  });

  it("selects the blue rate through the submenu", async () => {
    const onUpdateUsdRate = jest.fn();
    const user = userEvent.setup();

    renderMonthlyExpensesTable(
      [createRow({ currency: "USD", description: "Netflix", id: "expense-1" })],
      { onUpdateUsdRate },
    );

    await user.click(
      screen.getByRole("button", { name: "Abrir acciones para Netflix" }),
    );
    await selectDropdownSubmenuItem(
      user,
      "Tipo de cambio",
      "Dólar blue",
      "menuitemradio",
    );

    await waitFor(() => {
      expect(onUpdateUsdRate).toHaveBeenCalledWith({
        customUsdRate: null,
        expenseId: "expense-1",
        usdRateType: "blue",
      });
    });
  });

  it("opens the custom-rate dialog and saves the manual rate", async () => {
    const onUpdateUsdRate = jest.fn();
    const user = userEvent.setup();

    renderMonthlyExpensesTable(
      [createRow({ currency: "USD", description: "Spotify", id: "expense-1" })],
      { onUpdateUsdRate },
    );

    await user.click(
      screen.getByRole("button", { name: "Abrir acciones para Spotify" }),
    );
    await selectDropdownSubmenuItem(
      user,
      "Tipo de cambio",
      "Personalizada…",
      "menuitemradio",
    );

    const rateInput = await screen.findByLabelText(
      "Cotización personalizada de Spotify",
    );

    await user.type(rateInput, "1480,50");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(onUpdateUsdRate).toHaveBeenCalledWith({
        customUsdRate: 1480.5,
        expenseId: "expense-1",
        usdRateType: "custom",
      });
    });
  });

  it("rejects a non-positive custom rate with an inline error", async () => {
    const onUpdateUsdRate = jest.fn();
    const user = userEvent.setup();

    renderMonthlyExpensesTable(
      [createRow({ currency: "USD", description: "Spotify", id: "expense-1" })],
      { onUpdateUsdRate },
    );

    await user.click(
      screen.getByRole("button", { name: "Abrir acciones para Spotify" }),
    );
    await selectDropdownSubmenuItem(
      user,
      "Tipo de cambio",
      "Personalizada…",
      "menuitemradio",
    );

    const rateInput = await screen.findByLabelText(
      "Cotización personalizada de Spotify",
    );

    await user.type(rateInput, "0");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /mayor a 0/,
    );
    expect(onUpdateUsdRate).not.toHaveBeenCalled();
  });

  it("converts the total with the per-row rate type", () => {
    renderMonthlyExpensesTable(
      [
        createRow({
          currency: "USD",
          description: "Efectivo blue",
          id: "expense-1",
          subtotal: "10",
          total: "10",
          usdRateType: "blue",
        }),
      ],
      { exchangeRateSnapshot: SNAPSHOT },
    );

    // 10 USD × blue (1500) = 15.000 ARS, no el solidario (13.000).
    const table = screen.getAllByRole("table")[0];

    expect(normalizeSpaces(table.textContent ?? "")).toContain("15.000");
    expect(normalizeSpaces(table.textContent ?? "")).not.toContain("13.000");
  });

  it("converts the total with the custom rate", () => {
    renderMonthlyExpensesTable(
      [
        createRow({
          currency: "USD",
          customUsdRate: 2000,
          description: "Tasa manual",
          id: "expense-1",
          subtotal: "10",
          total: "10",
          usdRateType: "custom",
        }),
      ],
      { exchangeRateSnapshot: SNAPSHOT },
    );

    const table = screen.getAllByRole("table")[0];

    expect(normalizeSpaces(table.textContent ?? "")).toContain("20.000");
  });
});
