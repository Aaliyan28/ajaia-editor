"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SeededUser } from "@/lib/current-user";

export function Header({
  currentUserId,
  users,
}: {
  currentUserId: string;
  users: SeededUser[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchUser(userId: string) {
    if (userId === currentUserId) return;
    setPending(true);
    try {
      const res = await fetch("/api/current-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to switch user");
      router.refresh();
    } catch {
      // Reset the pending state so the control is usable again.
      setPending(false);
      return;
    }
    setPending(false);
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ajaia
        </Link>
        <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>Acting as</span>
          <select
            value={currentUserId}
            disabled={pending}
            onChange={(e) => switchUser(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
