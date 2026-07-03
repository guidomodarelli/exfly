import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Selects an item nested inside a Radix dropdown submenu.
 *
 * jsdom does not deliver the pointer-event sequence Radix expects for items
 * rendered inside `DropdownMenuSubContent`, so plain `user.click` never fires
 * their `onSelect`. Opening the submenu with a click and confirming with
 * keyboard focus + Enter exercises the same public interaction contract.
 */
export async function selectDropdownSubmenuItem(
  user: UserEvent,
  submenuTriggerName: string,
  itemName: string,
): Promise<void> {
  await user.click(
    screen.getByRole("menuitem", { name: submenuTriggerName }),
  );

  const submenuItem = await screen.findByRole("menuitem", { name: itemName });

  submenuItem.focus();
  await user.keyboard("{Enter}");
}
