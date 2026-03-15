import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LenderPicker } from "./lender-picker";

describe("LenderPicker", () => {
  it("closes the panel when clicking outside without selecting a lender", async () => {
    const user = userEvent.setup();
    const onAddLender = jest.fn();
    const onSelect = jest.fn();

    render(
      <div>
        <button type="button">Fuera</button>
        <LenderPicker
          onAddLender={onAddLender}
          onSelect={onSelect}
          options={[]}
          selectedLenderId=""
          selectedLenderName=""
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));

    expect(screen.getByLabelText("Buscar prestador")).toBeInTheDocument();
    expect(
      screen.getByText("No hay prestadores registrados todavía."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar prestador" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fuera" }));

    expect(screen.queryByLabelText("Buscar prestador")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No hay prestadores registrados todavía."),
    ).not.toBeInTheDocument();
    expect(onAddLender).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("triggers lender creation from the picker panel", async () => {
    const user = userEvent.setup();
    const onAddLender = jest.fn();

    render(
      <LenderPicker
        onAddLender={onAddLender}
        onSelect={jest.fn()}
        options={[]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));
    await user.click(screen.getByRole("button", { name: "Agregar prestador" }));

    expect(onAddLender).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Buscar prestador")).not.toBeInTheDocument();
  });

  it("keeps the add lender action visible when there are lender options", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Banco Ciudad",
            type: "bank",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));

    expect(screen.getByRole("button", { name: /Banco Ciudad/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar prestador" }),
    ).toBeInTheDocument();
  });
});
