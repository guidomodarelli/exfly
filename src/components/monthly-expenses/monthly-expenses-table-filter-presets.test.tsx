import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  getPersistedMonthlyExpensesFilterPresets,
  persistMonthlyExpensesFilterPresets,
} from "./monthly-expenses-filter-presets";
import {
  createRow,
  renderMonthlyExpensesTable,
} from "./monthly-expenses-table-test-utils";

const ROWS = [
  createRow({ description: "Internet", id: "expense-1", total: "2000" }),
  createRow({ description: "Luz", id: "expense-2", total: "500" }),
];

async function typeInQueryBar(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
) {
  const queryBar = screen.getByRole("combobox", {
    name: "Filtro unificado de gastos",
  });

  await user.click(queryBar);
  await user.type(queryBar, query);
}

describe("MonthlyExpensesTable filter presets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("disables saving while the filter bar has no active filters", () => {
    renderMonthlyExpensesTable(ROWS);

    expect(
      screen.getByRole("button", { name: "Guardar filtro" }),
    ).toBeDisabled();
  });

  it("saves the current query as a named preset chip", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS);

    await typeInQueryBar(user, "Internet");
    await user.click(screen.getByRole("button", { name: "Guardar filtro" }));
    await user.type(
      await screen.findByLabelText("Nombre del filtro"),
      "Solo Internet",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar filtro con nombre" }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Aplicar filtro guardado Solo Internet",
      }),
    ).toBeInTheDocument();
    expect(getPersistedMonthlyExpensesFilterPresets()).toEqual([
      { name: "Solo Internet", query: "Internet" },
    ]);
  });

  it("applies a saved preset with one click", async () => {
    persistMonthlyExpensesFilterPresets([
      { name: "Solo Internet", query: "Internet" },
    ]);
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS);

    expect(screen.getByText("Luz")).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", {
        name: "Aplicar filtro guardado Solo Internet",
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Luz")).not.toBeInTheDocument();
    });
    // La descripción resaltada anida varios nodos con el mismo texto.
    expect(screen.getAllByText("Internet").length).toBeGreaterThan(0);
  });

  it("deletes a saved preset", async () => {
    persistMonthlyExpensesFilterPresets([
      { name: "Solo Internet", query: "Internet" },
    ]);
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS);

    await user.click(
      await screen.findByRole("button", {
        name: "Eliminar filtro guardado Solo Internet",
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Aplicar filtro guardado Solo Internet",
        }),
      ).not.toBeInTheDocument();
    });
    expect(getPersistedMonthlyExpensesFilterPresets()).toEqual([]);
  });
});
