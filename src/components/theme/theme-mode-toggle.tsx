import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const THEME_TRANSITION_ATTRIBUTE = "transition-style";
const THEME_TRANSITION_VALUE = "in:circle:center";
const DEFAULT_THEME_TRANSITION_DURATION_MS = 1500;

type ViewTransitionWithFinished = {
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>,
  ) => ViewTransitionWithFinished;
};

function getThemeTransitionDurationMs(rootElement: HTMLElement): number {
  const rawDuration = getComputedStyle(rootElement)
    .getPropertyValue("--transition__duration")
    .trim();

  if (rawDuration.endsWith("ms")) {
    const milliseconds = Number.parseFloat(rawDuration.slice(0, -2));

    return Number.isFinite(milliseconds) && milliseconds > 0
      ? milliseconds
      : DEFAULT_THEME_TRANSITION_DURATION_MS;
  }

  if (rawDuration.endsWith("s")) {
    const seconds = Number.parseFloat(rawDuration.slice(0, -1));

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return DEFAULT_THEME_TRANSITION_DURATION_MS;
    }

    return seconds * 1000;
  }

  return DEFAULT_THEME_TRANSITION_DURATION_MS;
}

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
    const nextTheme = isDarkMode ? "light" : "dark";

    if (typeof document === "undefined") {
      setTheme(nextTheme);
      return;
    }

    const rootElement = document.documentElement;
    const documentWithViewTransition = document as DocumentWithViewTransition;

    rootElement.setAttribute(
      THEME_TRANSITION_ATTRIBUTE,
      THEME_TRANSITION_VALUE,
    );

    if (documentWithViewTransition.startViewTransition) {
      const viewTransition = documentWithViewTransition.startViewTransition(() => {
        setTheme(nextTheme);
      });

      void viewTransition.finished.finally(() => {
        rootElement.removeAttribute(THEME_TRANSITION_ATTRIBUTE);
      });

      return;
    }

    setTheme(nextTheme);

    const transitionDurationMs = getThemeTransitionDurationMs(rootElement);

    window.setTimeout(() => {
      rootElement.removeAttribute(THEME_TRANSITION_ATTRIBUTE);
    }, transitionDurationMs);
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
