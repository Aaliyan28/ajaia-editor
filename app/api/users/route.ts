import { getUsers } from "@/lib/current-user";
import { errorResponse } from "@/lib/http";

// GET /api/users — the seeded users, for the switcher and share modal.
export async function GET() {
  try {
    const users = await getUsers();
    return Response.json(users);
  } catch {
    return errorResponse("Failed to load users", 500);
  }
}
