export function getAdminErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const code = typeof value.code === "string" ? value.code : "";
    const message = typeof value.message === "string" ? value.message : "";

    if (code === "PGRST205" || /could not find the table .*schema cache/i.test(message)) {
      if (/page_media/i.test(message)) {
        return "Page image controls need the new page_media table. Run supabase/migrations/0003_page_media.sql in Supabase SQL Editor, then refresh.";
      }
      return "Supabase CMS tables are missing. Apply migrations 0001_portfolio_cms.sql, 0002_admin_only_cms_writes.sql, and 0003_page_media.sql, then retry.";
    }

    const details = typeof value.details === "string" ? value.details : "";
    const hint = typeof value.hint === "string" ? value.hint : "";
    const description = [message, details, hint].filter(Boolean).join(" ");

    if (description) {
      return code ? `${description} (${code})` : description;
    }
  }

  return fallback;
}
