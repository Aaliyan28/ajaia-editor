import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const USER_COOKIE = "ajaia_uid";

export type SeededUser = { id: string; name: string; email: string };

/** All seeded users, for the "act as" switcher and the share modal. */
export async function getUsers(): Promise<SeededUser[]> {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

/**
 * The user we are currently acting as. Read from the cookie; falls back to the
 * first seeded user when the cookie is missing or points at a deleted user.
 * There is no real auth — this is the mocked "current user" the assignment allows.
 */
export async function getCurrentUser(): Promise<SeededUser> {
  const store = await cookies();
  const uid = store.get(USER_COOKIE)?.value;

  if (uid) {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, name: true, email: true },
    });
    if (user) return user;
  }

  const first = await prisma.user.findFirst({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  if (!first) {
    throw new Error("No seeded users found — run `npm run db:seed`.");
  }
  return first;
}
