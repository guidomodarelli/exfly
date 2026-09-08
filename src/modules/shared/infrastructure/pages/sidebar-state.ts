export { SIDEBAR_STATE_COOKIE_NAME } from "@/modules/shared/shared/constants/sidebar";

export function getRequestedSidebarOpen(cookieValue: string | undefined): boolean {
  if (cookieValue === "false") {
    return false;
  }

  if (cookieValue === "true") {
    return true;
  }

  return true;
}
