type UserClaims = {
  app_metadata?: Record<string, unknown>;
} | null | undefined;

export function isPortfolioAdmin(user: UserClaims): boolean {
  return user?.app_metadata?.role === "admin";
}

export function safeAdminPath(path: string | undefined): string {
  if (
    path &&
    /^\/admin(?:\/|$)/.test(path) &&
    !path.startsWith("//") &&
    !path.includes("\\")
  ) {
    return path;
  }

  return "/admin/dashboard";
}
