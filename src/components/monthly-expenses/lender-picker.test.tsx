import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LenderPicker } from "./lender-picker";

describe("LenderPicker", () => {
  it("closes the panel when clicking outside without selecting a lender", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <div>
        <button type="button">Fuera</button>
        <LenderPicker
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

    await user.click(screen.getByRole("button", { name: "Fuera" }));

    expect(screen.queryByLabelText("Buscar prestador")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No hay prestadores registrados todavía."),
    ).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});