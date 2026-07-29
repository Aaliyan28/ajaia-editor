import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { BadJsonError, errorResponse, parseJsonBody } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

async function requireOwnedDoc(id: string) {
  const user = await getCurrentUser();
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });
  return { user, doc };
}

// GET /api/documents/[id]/shares — list who a document is shared with (owner only).
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { user, doc } = await requireOwnedDoc(id);
    if (!doc) return errorResponse("Document not found", 404);
    if (doc.ownerId !== user.id) return errorResponse("Only the owner can view shares", 403);

    const shares = await prisma.share.findMany({
      where: { documentId: id },
      select: { userId: true, permission: true },
    });
    return Response.json(shares);
  } catch {
    return errorResponse("Failed to load shares", 500);
  }
}

// POST /api/documents/[id]/shares — share with a user at a permission (owner only).
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    if (e instanceof BadJsonError) return errorResponse(e.message, 400);
    return errorResponse("Bad request", 400);
  }

  const userId = body.userId;
  const permission = body.permission;
  if (typeof userId !== "string" || !userId.trim()) {
    return errorResponse("userId is required", 400);
  }
  if (permission !== "view" && permission !== "edit") {
    return errorResponse("permission must be 'view' or 'edit'", 400);
  }

  try {
    const { user, doc } = await requireOwnedDoc(id);
    if (!doc) return errorResponse("Document not found", 404);
    if (doc.ownerId !== user.id) return errorResponse("Only the owner can share", 403);
    if (userId === doc.ownerId) return errorResponse("Cannot share with the owner", 400);

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return errorResponse("Unknown user", 404);

    const share = await prisma.share.upsert({
      where: { documentId_userId: { documentId: id, userId } },
      update: { permission },
      create: { documentId: id, userId, permission },
      select: { userId: true, permission: true },
    });
    return Response.json(share, { status: 201 });
  } catch {
    return errorResponse("Failed to share document", 500);
  }
}

// DELETE /api/documents/[id]/shares?userId=... — revoke a share (owner only).
export async function DELETE(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return errorResponse("userId query parameter is required", 400);

  try {
    const { user, doc } = await requireOwnedDoc(id);
    if (!doc) return errorResponse("Document not found", 404);
    if (doc.ownerId !== user.id) return errorResponse("Only the owner can revoke access", 403);

    await prisma.share.deleteMany({ where: { documentId: id, userId } });
    return Response.json({ ok: true });
  } catch {
    return errorResponse("Failed to revoke access", 500);
  }
}
