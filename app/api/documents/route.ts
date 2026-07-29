import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { EMPTY_DOC } from "@/lib/tiptap";
import { BadJsonError, errorResponse, normalizeTitle, parseJsonBody } from "@/lib/http";

// POST /api/documents — create a new document owned by the current user.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    if (e instanceof BadJsonError) return errorResponse(e.message, 400);
    return errorResponse("Bad request", 400);
  }

  const title = normalizeTitle(body.title);
  if (!title.ok) return errorResponse(title.error, 400);

  try {
    const user = await getCurrentUser();
    const doc = await prisma.document.create({
      data: { title: title.title, contentJson: EMPTY_DOC, ownerId: user.id },
      select: { id: true, title: true, updatedAt: true },
    });
    return Response.json(doc, { status: 201 });
  } catch {
    return errorResponse("Failed to create document", 500);
  }
}
