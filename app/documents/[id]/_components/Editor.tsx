"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent, type Editor as TiptapEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type SaveStatus = "saved" | "dirty" | "saving";

export function Editor({
  docId,
  initialTitle,
  initialContent,
  ownerName,
  editable,
}: {
  docId: string;
  initialTitle: string;
  initialContent: JSONContent;
  ownerName: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);

  const savingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable,
    // Required for Next.js SSR to avoid a hydration mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap" },
    },
    onUpdate: () => markDirty(),
  });

  const save = useCallback(async () => {
    if (!editor || savingRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    savingRef.current = true;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Untitled document", contentJson: editor.getJSON() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      setStatus("saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStatus("dirty");
    } finally {
      savingRef.current = false;
    }
  }, [editor, docId, title, router]);

  // Mark the document dirty and schedule a debounced autosave.
  const markDirty = useCallback(() => {
    setStatus("dirty");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void save(), 1500);
  }, [save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (status !== "saved") e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
          ← Back to documents
        </Link>
        {editable ? (
          <div className="flex items-center gap-3">
            <StatusLabel status={status} />
            <button
              onClick={() => void save()}
              disabled={status === "saving"}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {status === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            View only
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (editable) markDirty();
        }}
        readOnly={!editable}
        placeholder="Untitled document"
        className="mt-4 w-full bg-transparent text-3xl font-semibold tracking-tight text-zinc-900 focus:outline-none disabled:opacity-100 dark:text-zinc-50"
      />
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Owned by {ownerName}</p>

      {editable && <Toolbar editor={editor} />}

      <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function StatusLabel({ status }: { status: SaveStatus }) {
  const text = status === "saved" ? "Saved" : status === "saving" ? "Saving…" : "Unsaved changes";
  return <span className="text-xs text-zinc-400">{text}</span>;
}

function Toolbar({ editor }: { editor: TiptapEditor | null }) {
  // Re-render the toolbar as selection/marks change so active states stay accurate.
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => force((n) => n + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
      <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <Divider />
      <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-8 rounded px-2 py-1 text-sm ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />;
}
