import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { canEdit, canView } from "@/lib/access";
import { Editor } from "./_components/Editor";

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

  return (
    <Editor
      docId={doc.id}
      initialTitle={doc.title}
      initialContent={doc.contentJson as JSONContent}
      ownerName={doc.owner.name}
      editable={canEdit(access)}
    />
  );
}
