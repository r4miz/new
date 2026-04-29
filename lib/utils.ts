import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Convert a workspace UUID to a Postgres schema name. UUIDs have hyphens
 *  which are illegal in unquoted schema names, so we strip them. */
export function workspaceSchemaName(workspaceId: string): string {
  return `ws_${workspaceId.replace(/-/g, "")}`
}

/** Sanitize a user-provided dataset name into a valid Postgres table name. */
export function sanitizeTableName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[0-9]/, "t$&")
    .replace(/_+/g, "_")
    .slice(0, 50)
}
