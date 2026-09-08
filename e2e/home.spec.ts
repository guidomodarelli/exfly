import { expect, test } from "@playwright/test";

test("renders monthly expenses on root route", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/gastos/);
  await expect(
    page.getByRole("heading", { name: "Control mensual", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Detalle del mes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Conectar cuenta de Google" }),
  ).toBeVisible();
});

test("keeps light theme after reload when persisted theme is light", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme", "light");
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/gastos/);
  await expect(page.getByRole("heading", { name: "Detalle del mes" })).toBeVisible();

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });
  }).toBe(false);

  await page.reload();

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      // Browsers may serialize the same compiled color as lab, rgb or oklch.
      const hasLightBackground = /^(lab\(100|rgb\(255, 255, 255|oklch\(1 )/.test(
        getComputedStyle(document.body).backgroundColor,
      );

      return {
        colorScheme: rootStyles.colorScheme,
        hasLightBackground,
        hasDarkClass: document.documentElement.classList.contains("dark"),
        hasLightClass: document.documentElement.classList.contains("light"),
      };
    });
  }).toEqual({
    colorScheme: "light",
    hasLightBackground: true,
    hasDarkClass: false,
    hasLightClass: true,
  });
});

test("uses system theme when no persisted theme exists", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    window.localStorage.removeItem("theme");
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/gastos/);
  await expect(page.getByRole("heading", { name: "Detalle del mes" })).toBeVisible();

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });
  }).toBe(true);
});

test("toggles to dark correctly after reloading in persisted light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    window.localStorage.setItem("theme", "light");
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/gastos/);
  await expect(page.getByRole("heading", { name: "Detalle del mes" })).toBeVisible();
  await page.reload();

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });
  }).toBe(false);

  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro", exact: true }).click();

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return {
        darkClass: document.documentElement.classList.contains("dark"),
        colorScheme: getComputedStyle(document.documentElement).colorScheme,
        persistedTheme: window.localStorage.getItem("theme"),
      };
    });
  }).toEqual({
    darkClass: true,
    colorScheme: "dark",
    persistedTheme: "dark",
  });
});
