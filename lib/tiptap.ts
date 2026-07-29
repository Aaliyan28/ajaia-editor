import type { Prisma } from "@/generated/client";

// An empty Tiptap document — a single empty paragraph. Used as the initial
// content when creating a new document.
export const EMPTY_DOC: Prisma.InputJsonValue = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
