import { getCurrentUser, getUsers } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import type { Permission } from "@/lib/access";
import { Header } from "./_components/Header";
import { DocumentsView } from "./_components/DocumentsView";

// Reads the current-user cookie, so this route always renders per-request.
export const dynamic = "force-dynamic";

export type OwnedDoc = { id: string; title: string; updatedAt: string };
export type SharedDoc = OwnedDoc & { ownerName: string; permission: Permission };

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Home() {
  const [currentUser, users] = await Promise.all([getCurrentUser(), getUsers()]);

  const [ownedRaw, sharedRaw] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: currentUser.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true } },
        shares: { where: { userId: currentUser.id }, select: { permission: true } },
      },
    }),
  ]);

  const owned: OwnedDoc[] = ownedRaw.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: formatDate(d.updatedAt),
  }));

  const shared: SharedDoc[] = sharedRaw.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: formatDate(d.updatedAt),
    ownerName: d.owner.name,
    permission: d.shares[0]?.permission ?? "view",
  }));

  return (
    <div className="min-h-screen">
      <Header currentUserId={currentUser.id} users={users} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <DocumentsView
          owned={owned}
          shared={shared}
          users={users}
          currentUserId={currentUser.id}
        />
      </main>
    </div>
  );
}
