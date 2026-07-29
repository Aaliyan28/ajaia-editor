import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, USER_COOKIE } from "@/lib/current-user";
import { BadJsonError, errorResponse, parseJsonBody } from "@/lib/http";

// GET /api/current-user — who we are acting as right now.
export async function GET() {
  try {
    const user = await getCurrentUser();
    return Response.json(user);
  } catch {
    return errorResponse("Failed to resolve current user", 500);
  }
}

// POST /api/current-user — switch the acting user (stored in a cookie).
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    if (e instanceof BadJsonError) return errorResponse(e.message, 400);
    return errorResponse("Bad request", 400);
  }

  const userId = body.userId;
  if (typeof userId !== "string" || !userId.trim()) {
    return errorResponse("userId is required", 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return errorResponse("Unknown user", 404);

    const store = await cookies();
    store.set(USER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return Response.json(user);
  } catch {
    return errorResponse("Failed to switch user", 500);
  }
}
