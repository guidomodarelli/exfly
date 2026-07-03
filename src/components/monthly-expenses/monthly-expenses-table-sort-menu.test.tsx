import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createRow,
  getTableTextOrder,
  renderMonthlyExpensesTable,
} from "./monthly-expenses-table-test-utils";

const FOLDERS = [
  { color: null, icon: null, id: "folder-home", name: "Hogar" },
  { color: null, icon: null, id: "folder-services", name: "Servicios" },
];

const ROWS = [
  createRow({
    description: "Compra suelta",
    expenseFolderId: "",
    id: "expense-1",
    total: "200",
  }),
  createRow({
    description: "Internet",
    expenseFolderId: "folder-services",
    id: "expense-2",
    total: "50",
  }),
  createRow({
    description: "Alquiler",
    expenseFolderId: "folder-home",
    id: "expense-3",
    total: "100",
  }),
  createRow({
    description: "Luz",
    expenseFolderId: "folder-services",
    id: "expense-4",
    total: "300",
  }),
];

async function selectSortBy(
  user: ReturnType<typeof userEvent.setup>,
  optionName: RegExp | string,
) {
  await user.click(screen.getByRole("button", { name: /^Ordenar por/ }));
  await user.click(screen.getByRole("menuitemradio", { name: optionName }));
  await user.keyboard("{Escape}");
}

async function selectSortDirection(
  user: ReturnType<typeof userEvent.setup>,
  directionName: string,
) {
  await user.click(screen.getByRole("button", { name: /^Ordenar por/ }));
  await user.click(
    screen.getByRole("menuitemradio", { name: directionName }),
  );
  await user.keyboard("{Escape}");
}

describe("MonthlyExpensesTable sort menu", () => {
  it("sorts all rows by total when no grouping is active", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await selectSortBy(user, /Total/);
    await selectSortDirection(user, "Descendente");

    await waitFor(() => {
      expect(
        getTableTextOrder(["Luz", "Compra suelta", "Alquiler", "Internet"]),
      ).toEqual(["Luz", "Compra suelta", "Alquiler", "Internet"]);
    });

    expect(
      screen.getByRole("button", { name: "Ordenar por: Total" }),
    ).toBeInTheDocument();
  });

  it("keeps the folder groups and sorts within each group", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await user.click(screen.getByRole("button", { name: /^Agrupar por/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /Carpeta/ }));
    await user.keyboard("{Escape}");

    await selectSortBy(user, /Total/);
    await selectSortDirection(user, "Descendente");

    // El agrupado manda: Hogar → Servicios → Sin carpeta; adentro, total desc.
    await waitFor(() => {
      expect(
        getTableTextOrder([
          "Hogar",
          "Alquiler",
          "Servicios",
          "Luz",
          "Internet",
          "Sin carpeta",
          "Compra suelta",
        ]),
      ).toEqual([
        "Hogar",
        "Alquiler",
        "Servicios",
        "Luz",
        "Internet",
        "Sin carpeta",
        "Compra suelta",
      ]);
    });
  });

  it("sorts by description ascending", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await selectSortBy(user, /Descripción/);

    await waitFor(() => {
      expect(
        getTableTextOrder(["Alquiler", "Compra suelta", "Internet", "Luz"]),
      ).toEqual(["Alquiler", "Compra suelta", "Internet", "Luz"]);
    });
  });

  it("disables the sort criteria while a manual column sort is active", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await user.click(screen.getByRole("button", { name: "Ordenar Total" }));
    await user.click(screen.getByRole("button", { name: /^Ordenar por/ }));

    expect(
      screen.getByRole("menuitemradio", { name: /Total/ }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
