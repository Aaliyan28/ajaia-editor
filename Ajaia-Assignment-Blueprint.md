# Ajaia Assignment — Build Blueprint

**Goal:** ship the strongest *coherent slice* of a collaborative doc editor in ~5 hours, and make deliberate scope cuts the reviewers can see and respect. They say it explicitly: *"Strong candidates usually make deliberate scope cuts and explain them clearly."* Depth over coverage.

**The core bet:** nail **editing + sharing + persistence + a clean deploy**. Everything else is negotiable. Do **not** build real authentication, do **not** chase real-time collaboration, do **not** support .docx.

---

## 1. Locked stack (don't debate this once you start)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Full-stack in one repo, one deploy. Matches your portfolio. |
| Styling | **Tailwind CSS** | Fast, you know it. |
| Editor | **Tiptap** | Gives bold/italic/underline/headings/lists out of the box. Never hand-roll an editor. |
| DB | **Postgres on Neon (free tier)** | Serverless-friendly, works cleanly with Vercel. |
| ORM | **Prisma** | Fast schema + migrations, type-safe. |
| Auth | **Seeded users + a "current user" switcher** | The assignment *allows* mocked auth. This is your biggest time-saver. |
| Tests | **Vitest** | One meaningful test, quick to wire. |
| Deploy | **Vercel** | Native for Next.js, free, instant. |

> ⚠️ **Do not use SQLite.** Vercel's filesystem is ephemeral — a SQLite file won't persist. Neon Postgres avoids this trap entirely. This one decision prevents the classic "works locally, broken in prod" disaster at hour 4.

---

## 2. Scope: BUILD vs CUT (mapped to their 5 requirements)

| Requirement | BUILD (minimal, complete) | CUT / defer (state it) |
|---|---|---|
| **1. Create & edit** | Create, rename, edit, save, reopen. Tiptap with bold/italic/underline/H1-H2/bullet+numbered lists. | Fonts, colors, tables, images. |
| **2. File upload** | Upload **.txt / .md** → convert to a new editable doc. State supported types in UI + README. | .docx parsing (mention as "next 2-4h"). |
| **3. Sharing** | Owner field + Share join table. UI: "My Documents" vs "Shared with me". Share by picking a seeded user + granting view/edit. | Email invites, real RBAC, link sharing. |
| **4. Persistence** | Postgres via Prisma. Content stored as Tiptap JSON. Survives refresh; shared access demonstrable. | Autosave-on-keystroke (use save button + debounce). |
| **5. Eng quality** | README, live URL, validation + error handling, **1 Vitest test**, architecture note. | Full test suite, CI. |

**The auth cut, spelled out:** seed 3 users (e.g. Alice, Bob, Carol). Header has a dropdown to "act as" a user, stored in a cookie. Reviewers test sharing by switching users. This satisfies "a document owner," "grant another user access," and "seeded users to review sharing flows" — with zero auth code.

---

## 3. Data model (give this to Claude Code verbatim)

```
User      { id, name, email }
Document  { id, title, contentJson (Json), ownerId -> User, createdAt, updatedAt }
Share     { id, documentId -> Document, userId -> User, permission ("view"|"edit"), createdAt }
```

- Store Tiptap's `getJSON()` output in `contentJson` (preserves structure).
- "My Documents" = docs where `ownerId == currentUser`.
- "Shared with me" = docs joined through `Share` where `userId == currentUser`.

---

## 4. Time-boxed execution plan

Target ~4h15 build + ~45m docs/video. **Deploy the empty skeleton in the first 30 minutes** so deployment is never a surprise at the end.

| Clock | Phase | Done when… |
|---|---|---|
| 0:00–0:25 | Scaffold: Next.js + Tailwind + Prisma + Neon connected, seed script for 3 users | `npm run dev` works, DB connected |
| 0:25–0:40 | **Deploy skeleton to Vercel now** (env vars, migrate) | Live URL loads a "hello" page ✅ de-risked |
| 0:40–1:40 | Doc CRUD + list views ("My" / "Shared with me") + current-user switcher | Create/rename/list/delete works |
| 1:40–2:40 | Tiptap editor + toolbar + save/reopen | Formatting persists across refresh |
| 2:40–3:20 | Sharing: share modal (pick user + permission), Share records, shared view | Bob sees a doc Alice shared |
| 3:20–3:50 | File upload (.txt/.md → new doc via `marked` for md) | Upload creates an editable doc |
| 3:50–4:15 | Validation + error handling + **1 Vitest test** (test the access-control helper) | Test passes, bad input handled |
| 4:15–4:35 | **Final deploy** + smoke-test the live URL | All flows work in prod |
| 4:35–5:05 | README + architecture note + AI note + SUBMISSION.md | Deliverables complete |
| 5:05–5:35 | Record 3–5 min walkthrough, assemble Drive folder | Submitted |

### 🚨 Minimum shippable checkpoint (~hour 3)
If you're running behind, this is a *complete, submittable* product: **create / edit / format / save / reopen, persisted, deployed.** Everything after (sharing, upload, test) is additive. Never let the clock hit zero with nothing deployed. Ship the core, then add.

---

## 5. Driving Claude Code without burning your session

- **Feed it this whole blueprint first.** Then let it scaffold the full skeleton in one pass.
- **Work feature-by-feature, commit after each.** "Build the editor" → test → commit → "now sharing." Small, verifiable chunks.
- **Explicitly forbid gold-plating:** end prompts with *"Keep it minimal and working. Do not add features beyond what I asked. No extra abstractions."*
- **Don't debug blind.** Paste the actual error back; don't let it guess in circles.
- **You stay the architect.** Read what it writes — you'll face a walkthrough where you explain every decision. If you can't explain it, don't ship it.
- **Save docs for the end**, generated *from the real code* — cheaper and accurate.

---

## 6. Kickoff prompt for Claude Code (paste this to start)

> Build a lightweight collaborative document editor. **Stack:** Next.js (App Router) + TypeScript + Tailwind + Prisma + Postgres (Neon) + Tiptap. Deploy target: Vercel.
>
> **Scope — build exactly this, nothing more:**
> - Seed 3 users (Alice, Bob, Carol). No real auth — add a header dropdown to "act as" a user, persisted in a cookie.
> - Documents: create, rename, edit, save, reopen, delete. Tiptap editor with bold, italic, underline, H1/H2, bullet + numbered lists. Store content as Tiptap JSON.
> - Two views: "My Documents" (owned) and "Shared with me".
> - Sharing: a modal to share a doc with another seeded user, with view/edit permission, via a Share table.
> - File upload: .txt and .md only → convert to a new editable document (use `marked` for markdown).
> - Validation + error handling on all API routes.
> - One Vitest test for the sharing access-control helper.
>
> **Data model:** User{id,name,email}; Document{id,title,contentJson,ownerId,createdAt,updatedAt}; Share{id,documentId,userId,permission,createdAt}.
>
> First: scaffold the project, set up Prisma + the seed script, and give me the steps to connect Neon and deploy an empty skeleton to Vercel. Keep everything minimal and working — do not add features I didn't ask for.

---

## 7. Deliverables checklist (Google Drive folder)

- [ ] Source code
- [ ] `README.md` — local setup + run instructions, supported file types
- [ ] Architecture note (`.md`) — what you prioritized and why, the scope cuts
- [ ] AI workflow note (`.md`) — see section 8
- [ ] `SUBMISSION.md` — lists exactly what's included + seeded user names
- [ ] **Live product URL** (Vercel) + any seeded-user info reviewers need
- [ ] Text file with the walkthrough video URL (unlisted Loom/YouTube)
- [ ] Screenshots / demo GIF if helpful

---

## 8. AI workflow note — capture as you go (don't reconstruct at the end)

Keep a scratch file open and jot 4 things while working. They grade *practical* AI use, not volume:
1. **Tools used** — Claude Code (and Claude for planning, i.e. this blueprint).
2. **Where AI materially sped you up** — e.g. scaffolding, Tiptap wiring, Prisma schema.
3. **What you changed or rejected** — e.g. "Claude suggested NextAuth; I cut it for a seeded-user switcher to protect scope." (This one line shows judgment — include it.)
4. **How you verified correctness** — you read the code, tested flows manually, wrote the access-control test, smoke-tested prod.

That "what I rejected and why" point is where you prove you direct the AI rather than the reverse — it's worth the most.

---

## 9. Walkthrough video skeleton (3–5 min)

1. 20s — what you built, the one-line scope decision.
2. Main flow — create doc, format text, save, reopen (show persistence).
3. Sharing — switch from Alice to Bob, show the shared doc appears.
4. File upload — drop a .md, show it becomes editable.
5. 30s — what you deliberately deprioritized (real auth, real-time, .docx) and why.
6. 20s — how AI supported you + how you kept judgment.

Speak to *decisions*, not just clicks — that's the "verbal communication" they score.

---

## 10. Trap list (what sinks people)

- ❌ SQLite on Vercel → data vanishes. Use Neon.
- ❌ Building real auth → eats 90 minutes. Seed + switch.
- ❌ Real-time collab → a rabbit hole. It's optional stretch; skip it.
- ❌ .docx parsing → fiddly. Do .txt/.md; list .docx as "next steps."
- ❌ Deploying at the very end → discovering a prod bug with 10 min left. Deploy at minute 30.
- ❌ Autosave-on-keystroke → race conditions. Save button + debounce is plenty.

---

## 11. "If incomplete" framing (required in SUBMISSION.md)

For anything partial, state three things: **what works**, **what's incomplete**, **what you'd build with another 2–4 hours** (e.g. .docx import, real-time presence, version history, PDF export, granular roles). Naming these confidently reads as maturity, not weakness.
