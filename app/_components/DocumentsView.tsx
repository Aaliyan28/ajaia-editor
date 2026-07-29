"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OwnedDoc, SharedDoc } from "../page";
import type { SeededUser } from "@/lib/current-user";
import { ShareModal } from "./ShareModal";

export function DocumentsView({
  owned,
  shared,
  users,
  currentUserId,
}: {
  owned: OwnedDoc[];
  shared: SharedDoc[];
  users: SeededUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string } | null>(null);

  const shareCandidates = users.filter((u) => u.id !== currentUserId);

  async function run(fn: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createDocument() {
    await run(() =>
      fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
  }

  async function saveRename(id: string) {
    const title = editTitle.trim();
    if (!title) return;
    const ok = await run(() =>
      fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }),
    );
    if (ok) setEditingId(null);
  }

  async function deleteDocument(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    await run(() => fetch(`/api/documents/${id}`, { method: "DELETE" }));
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {/* My Documents */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            My Documents
          </h2>
          <button
            onClick={createDocument}
            disabled={busy}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            New document
          </button>
        </div>

        {owned.length === 0 ? (
          <EmptyState>No documents yet. Create your first one.</EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {owned.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === doc.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(doc.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                ) : (
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex-1 truncate text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {doc.title}
                  </Link>
                )}

                <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                  {doc.updatedAt}
                </span>

                {editingId === doc.id ? (
                  <>
                    <RowButton onClick={() => saveRename(doc.id)} disabled={busy}>
                      Save
                    </RowButton>
                    <RowButton onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </RowButton>
                  </>
                ) : (
                  <>
                    <RowButton
                      onClick={() => setShareTarget({ id: doc.id, title: doc.title })}
                      disabled={busy}
                    >
                      Share
                    </RowButton>
                    <RowButton
                      onClick={() => {
                        setEditingId(doc.id);
                        setEditTitle(doc.title);
                      }}
                      disabled={busy}
                    >
                      Rename
                    </RowButton>
                    <RowButton
                      onClick={() => deleteDocument(doc.id, doc.title)}
                      disabled={busy}
                      danger
                    >
                      Delete
                    </RowButton>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Shared with me */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Shared with me
        </h2>
        {shared.length === 0 ? (
          <EmptyState>Nothing has been shared with you yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {shared.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex-1 truncate text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {doc.title}
                </Link>
                <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                  by {doc.ownerName}
                </span>
                <PermissionBadge permission={doc.permission} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {shareTarget && (
        <ShareModal
          docId={shareTarget.id}
          docTitle={shareTarget.title}
          candidates={shareCandidates}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </p>
  );
}

function RowButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function PermissionBadge({ permission }: { permission: "view" | "edit" }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        permission === "edit"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {permission === "edit" ? "Can edit" : "View only"}
    </span>
  );
}
