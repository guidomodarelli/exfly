import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import { ExpenseReceiptUploadDialog } from "./expense-receipt-upload-dialog";

type DialogProps = ComponentProps<typeof ExpenseReceiptUploadDialog>;

function renderExpenseReceiptUploadDialog(overrides: Partial<DialogProps> = {}) {
  const onUpload = jest.fn<Promise<void>, [
    {
      coveredPayments: number;
      file: File;
    },
  ]>().mockResolvedValue(undefined);

  const props: DialogProps = {
    coveredPaymentsMax: 4,
    coveredPaymentsRemaining: 3,
    errorMessage: null,
    expenseDescription: "Internet",
    isOpen: true,
    isSubmitting: false,
    uploadProgressPercent: 0,
    onClose: jest.fn(),
    onUpload,
    ...overrides,
  };

  render(<ExpenseReceiptUploadDialog {...props} />);

  return {
    onUpload,
  };
}

describe("ExpenseReceiptUploadDialog", () => {
  it("uses a scrollable dialog container for small viewport heights", () => {
    renderExpenseReceiptUploadDialog();

    expect(screen.getByRole("dialog")).toHaveClass("dialogContent");
  });

  it("hides coverage choices when only one payment remains to be covered", () => {
    renderExpenseReceiptUploadDialog({
      coveredPaymentsMax: 1,
      coveredPaymentsRemaining: 1,
    });

    expect(
      screen.queryByText("Elegí cómo aplicar este comprobante:"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "Todo el periodo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "Cobertura parcial" }),
    ).not.toBeInTheDocument();
  });

  it("renders coverage choices as descriptive cards when more than one payment remains", () => {
    renderExpenseReceiptUploadDialog({
      coveredPaymentsMax: 4,
      coveredPaymentsRemaining: 3,
    });

    expect(
      screen.getByText("Elegí cómo aplicar este comprobante:"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Todo el periodo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "El comprobante cubre 3 pagos pendientes de un total de 4 pagos en este mes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Cobertura parcial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "El comprobante cubre solo la cantidad de pagos que indiques manualmente.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the partial covered payments label and sends custom quantity", async () => {
    const user = userEvent.setup();
    const { onUpload } = renderExpenseReceiptUploadDialog({
      coveredPaymentsMax: 4,
      coveredPaymentsRemaining: 3,
    });

    await user.click(screen.getByRole("radio", { name: "Cobertura parcial" }));

    const partialInput = screen.getByRole("spinbutton", {
      name: "Cantidad de pagos a cubrir",
    });

    await user.clear(partialInput);
    await user.type(partialInput, "2");

    const file = new File(["invoice"], "factura.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("File input not found");
    }

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: "Subir comprobante" }));

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });

    expect(onUpload).toHaveBeenCalledWith({
      coveredPayments: 2,
      file,
    });
  });

  it("validates partial coverage against remaining payments", async () => {
    const user = userEvent.setup();

    renderExpenseReceiptUploadDialog({
      coveredPaymentsMax: 8,
      coveredPaymentsRemaining: 3,
    });

    await user.click(screen.getByRole("radio", { name: "Cobertura parcial" }));

    const partialInput = screen.getByRole("spinbutton", {
      name: "Cantidad de pagos a cubrir",
    });

    await user.clear(partialInput);
    await user.type(partialInput, "4");

    expect(
      screen.getByText("Ingresá una cantidad de pagos válida entre 1 y 3."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Subir comprobante" }),
    ).toBeDisabled();
  });

  it("uploads one payment by default when coverage choices are hidden", async () => {
    const user = userEvent.setup();
    const { onUpload } = renderExpenseReceiptUploadDialog({
      coveredPaymentsMax: 1,
      coveredPaymentsRemaining: 1,
    });

    const file = new File(["invoice"], "factura.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("File input not found");
    }

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: "Subir comprobante" }));

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });

    expect(onUpload).toHaveBeenCalledWith({
      coveredPayments: 1,
      file,
    });
  });

  it("shows live upload progress percentage while submitting", async () => {
    const user = userEvent.setup();

    renderExpenseReceiptUploadDialog({
      isSubmitting: true,
      uploadProgressPercent: 73,
    });

    const file = new File(["invoice"], "factura.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("File input not found");
    }

    await user.upload(fileInput, file);

    expect(screen.getByText("Subiendo... 73%")).toBeInTheDocument();
  });

  it("keeps selected file when remove is canceled", async () => {
    const user = userEvent.setup();

    renderExpenseReceiptUploadDialog();

    const file = new File(["invoice"], "factura.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("File input not found");
    }

    await user.upload(fileInput, file);

    expect(screen.getByText("factura.pdf")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Quitar archivo factura.pdf",
      }),
    );

    expect(
      screen.getByText("¿Querés quitar este archivo seleccionado?"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Cancelar quitar archivo factura.pdf",
      }),
    );

    expect(screen.getByText("factura.pdf")).toBeInTheDocument();
  });

  it("clears selected file only after remove confirmation", async () => {
    const user = userEvent.setup();

    renderExpenseReceiptUploadDialog();

    const file = new File(["invoice"], "factura.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("File input not found");
    }

    await user.upload(fileInput, file);

    await user.click(
      screen.getByRole("button", {
        name: "Quitar archivo factura.pdf",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar quitar archivo factura.pdf",
      }),
    );

    expect(screen.queryByText("factura.pdf")).not.toBeInTheDocument();
  });

  it("resets selected file when the dialog is reopened", async () => {
    const user = userEvent.setup();
    const onUpload = jest.fn<Promise<void>, [
      {
        coveredPayments: number;
        file: File;
      },
    ]>().mockResolvedValue(undefined);
    const baseProps: DialogProps = {
      coveredPaymentsMax: 4,
      coveredPaymentsRemaining: 3,
      errorMessage: null,
      expenseDescription: "Internet",
      isOpen: true,
      isSubmitting: false,
      onClose: jest.fn(),
      onUpload,
      uploadProgressPercent: 0,
    };
    const { rerender } = render(<ExpenseReceiptUploadDialog {...baseProps} />);
    const file = new File(["invoice"], "factura.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("File input not found");
    }

    await user.upload(fileInput, file);
    expect(screen.getByText("factura.pdf")).toBeInTheDocument();

    rerender(<ExpenseReceiptUploadDialog {...baseProps} isOpen={false} />);
    rerender(<ExpenseReceiptUploadDialog {...baseProps} isOpen={true} />);

    expect(screen.queryByText("factura.pdf")).not.toBeInTheDocument();
  });
});
