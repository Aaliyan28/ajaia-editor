"use client";

import { useEffect, useState } from "react";
import type { SeededUser } from "@/lib/current-user";
import type { Permission } from "@/lib/access";

type ShareRow = { userId: string; permission: Permission };
type Access = "none" | Permission;

export function ShareModal({
  docId,
  docTitle,
  candidates,
  onClose,
}: {
  docId: string;
  docTitle: string;
  candidates: SeededUser[];
  onClose: () => void;
}) {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/documents/${docId}/shares`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return (await r.json()) as ShareRow[];
      })
      .then((rows) => active && setShares(rows))
      .catch(() => active && setError("Failed to load current shares"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [docId]);

  function accessFor(userId: string): Access {
    return shares.find((s) => s.userId === userId)?.permission ?? "none";
  }

  async function change(userId: string, value: Access) {
    setBusyUser(userId);
    setError(null);
    try {
      if (value === "none") {
        const r = await fetch(`/api/documents/${docId}/shares?userId=${userId}`, {
          method: "DELETE",
        });
        if (!r.ok) throw new Error();
        setShares((prev) => prev.filter((s) => s.userId !== userId));
      } else {
        const r = await fetch(`/api/documents/${docId}/shares`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, permission: value }),
        });
        if (!r.ok) throw new Error();
        const row = (await r.json()) as ShareRow;
        setShares((prev) => [...prev.filter((s) => s.userId !== userId), row]);
      }
    } catch {
      setError("Update failed — please try again");
    } finally {
      setBusyUser(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Share “{docTitle}”
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Give another user view or edit access.
        </p>

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {u.name}
                  </p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </div>
                <select
                  value={accessFor(u.id)}
                  disabled={busyUser === u.id}
                  onChange={(e) => change(u.id, e.target.value as Access)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="none">No access</option>
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
