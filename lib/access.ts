// Pure access-control helper for document sharing.
// Kept side-effect free (no DB, no request context) so it is easy to unit test.

export type Permission = "view" | "edit";

export interface ShareLike {
  userId: string;
  permission: Permission;
}

export interface DocumentAccessInput {
  /** The user whose access we are checking. */
  userId: string;
  /** The document owner's id. */
  ownerId: string;
  /** The document's share records. */
  shares: ShareLike[];
}

/**
 * The effective permission a user has on a document, or `null` if none.
 * The owner always has full ("edit") access; otherwise a matching share wins.
 */
export function getAccessLevel(input: DocumentAccessInput): Permission | null {
  const { userId, ownerId, shares } = input;
  if (userId === ownerId) return "edit";
  const share = shares.find((s) => s.userId === userId);
  return share ? share.permission : null;
}

/** Can the user open/read the document? */
export function canView(input: DocumentAccessInput): boolean {
  return getAccessLevel(input) !== null;
}

/** Can the user modify the document (title or content)? */
export function canEdit(input: DocumentAccessInput): boolean {
  return getAccessLevel(input) === "edit";
}
