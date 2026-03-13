import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const isDarkMode = resolvedTheme === "dark";
  const tooltipLabel = !isHydrated || resolvedTheme === undefined
    ? "Alternar tema"
    : isDarkMode
      ? "Cambiar a modo claro"
      : "Cambiar a modo oscuro";

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="Alternar tema"
          onClick={handleToggleTheme}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          {!isHydrated || resolvedTheme === undefined
            ? <SunMoon aria-hidden="true" />
            : isDarkMode
              ? <Sun aria-hidden="true" />
              : <Moon aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}
