import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { canEdit, canView } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      shares: { select: { userId: true, permission: true } },
    },
  });

  if (!doc) notFound();

  const access = { userId: user.id, ownerId: doc.ownerId, shares: doc.shares };

  if (!canView(access)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You don&apos;t have access to this document.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          ← Back to documents
        </Link>
      </div>
    );
  }

  const editable = canEdit(access);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
        ← Back to documents
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {doc.title}
        </h1>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {editable ? "Can edit" : "View only"}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Owned by {doc.owner.name}
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        The Tiptap editor arrives in the next step.
      </div>
    </div>
  );
}
