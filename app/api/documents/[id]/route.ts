import type { Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { canEdit, canView } from "@/lib/access";
import { BadJsonError, errorResponse, parseJsonBody } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

async function loadDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      shares: { select: { userId: true, permission: true } },
    },
  });
}

// GET /api/documents/[id] — read a document (owner or shared user).
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const user = await getCurrentUser();
    const doc = await loadDocument(id);
    if (!doc) return errorResponse("Document not found", 404);
    if (!canView({ userId: user.id, ownerId: doc.ownerId, shares: doc.shares })) {
      return errorResponse("You do not have access to this document", 403);
    }
    return Response.json(doc);
  } catch {
    return errorResponse("Failed to load document", 500);
  }
}

// PATCH /api/documents/[id] — rename and/or save content (requires edit access).
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    if (e instanceof BadJsonError) return errorResponse(e.message, 400);
    return errorResponse("Bad request", 400);
  }

  const data: Prisma.DocumentUpdateInput = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return errorResponse("title must be a string", 400);
    }
    const trimmed = body.title.trim();
    if (!trimmed) return errorResponse("title cannot be empty", 400);
    if (trimmed.length > 200) return errorResponse("title must be 200 characters or fewer", 400);
    data.title = trimmed;
  }

  if (body.contentJson !== undefined) {
    const content = body.contentJson;
    if (content === null || typeof content !== "object" || Array.isArray(content)) {
      return errorResponse("contentJson must be a Tiptap document object", 400);
    }
    data.contentJson = content as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return errorResponse("Provide title and/or contentJson to update", 400);
  }

  try {
    const user = await getCurrentUser();
    const doc = await loadDocument(id);
    if (!doc) return errorResponse("Document not found", 404);
    if (!canEdit({ userId: user.id, ownerId: doc.ownerId, shares: doc.shares })) {
      return errorResponse("You do not have edit access to this document", 403);
    }

    const updated = await prisma.document.update({
      where: { id },
      data,
      select: { id: true, title: true, updatedAt: true },
    });
    return Response.json(updated);
  } catch {
    return errorResponse("Failed to update document", 500);
  }
}

// DELETE /api/documents/[id] — delete a document (owner only).
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const user = await getCurrentUser();
    const doc = await loadDocument(id);
    if (!doc) return errorResponse("Document not found", 404);
    if (doc.ownerId !== user.id) {
      return errorResponse("Only the owner can delete this document", 403);
    }
    await prisma.document.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return errorResponse("Failed to delete document", 500);
  }
}
