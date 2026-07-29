// Small helpers for consistent API-route validation and error responses.

/** A JSON error response with a status code. */
export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Parse a request's JSON body, returning `{}` for an empty body and throwing a
 * typed marker for malformed JSON so callers can return a clean 400.
 */
export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new BadJsonError();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new BadJsonError();
  }
}

export class BadJsonError extends Error {
  constructor() {
    super("Invalid JSON body");
    this.name = "BadJsonError";
  }
}

/** Validate + trim an optional title, applying a default and a length cap. */
export function normalizeTitle(
  value: unknown,
  fallback = "Untitled document",
): { ok: true; title: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, title: fallback };
  if (typeof value !== "string") return { ok: false, error: "title must be a string" };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, title: fallback };
  if (trimmed.length > 200) return { ok: false, error: "title must be 200 characters or fewer" };
  return { ok: true, title: trimmed };
}
