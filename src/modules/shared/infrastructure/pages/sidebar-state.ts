export const SIDEBAR_STATE_COOKIE_NAME = "mes-en-regla.sidebar.open";

export function getRequestedSidebarOpen(cookieValue: string | undefined): boolean {
  if (cookieValue === "false") {
    return false;
  }

  if (cookieValue === "true") {
    return true;
  }

  return true;
}
