import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTheme, type UseThemeProps } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeModeToggle } from "./theme-mode-toggle";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

const mockedUseTheme = jest.mocked(useTheme);

function createThemeMock(
  resolvedTheme: UseThemeProps["resolvedTheme"],
  setTheme = jest.fn(),
): UseThemeProps {
  return {
    forcedTheme: undefined,
    resolvedTheme,
    setTheme,
    systemTheme: "light",
    theme: resolvedTheme,
    themes: ["light", "dark"],
  };
}

function renderThemeModeToggle() {
  return render(
    <TooltipProvider>
      <ThemeModeToggle />
    </TooltipProvider>,
  );
}

describe("ThemeModeToggle", () => {
  it("switches from light to dark mode", async () => {
    const user = userEvent.setup();
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue(createThemeMock("light", setTheme));

    renderThemeModeToggle();

    await user.click(screen.getByRole("button", { name: "Alternar tema" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches from dark to light mode", async () => {
    const user = userEvent.setup();
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue(createThemeMock("dark", setTheme));

    renderThemeModeToggle();

    await user.click(screen.getByRole("button", { name: "Alternar tema" }));

    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("shows tooltip text", async () => {
    const user = userEvent.setup();

    mockedUseTheme.mockReturnValue(createThemeMock("light"));

    renderThemeModeToggle();

    await user.hover(screen.getByRole("button", { name: "Alternar tema" }));

    expect(
      await screen.findByRole("tooltip", { name: "Cambiar a modo oscuro" }),
    ).toBeInTheDocument();
  });
});
