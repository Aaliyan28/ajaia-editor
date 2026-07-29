# Ajaia — Collaborative Document Editor

A lightweight collaborative document editor: create/edit rich-text documents,
share them with other users (view/edit), and upload `.txt` / `.md` files as new
editable documents.

> **Status:** skeleton scaffolded (Next.js + Prisma + Neon Postgres, deployable).
> Editor, document CRUD, sharing, and file upload land in subsequent steps.

## Stack

| Layer     | Choice                                            |
| --------- | ------------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript              |
| Styling   | Tailwind CSS v4                                    |
| Editor    | Tiptap (rich text, stored as Tiptap JSON)         |
| Database  | Postgres on Neon (free tier)                      |
| ORM       | Prisma 7 (via the `@prisma/adapter-pg` driver)    |
| Auth      | Seeded users + a "act as" switcher (no real auth) |
| Tests     | Vitest                                            |
| Deploy    | Vercel                                            |

Seeded users (switch between them to test sharing): **Alice**, **Bob**, **Carol**.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Connect a Neon database

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open **Connect** and copy the **pooled** connection
   string (the host contains `-pooler`). It looks like:
   `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`
3. Copy `.env.example` to `.env` and paste your string as `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```

### 3. Create the schema and seed users

```bash
npm run db:migrate -- --name init   # creates tables on Neon + a migration file
npm run db:seed                      # inserts Alice, Bob, Carol
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Ajaia editor skeleton"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. In [vercel.com/new](https://vercel.com/new), import the repo.
3. Add one environment variable **`DATABASE_URL`** = your Neon **pooled** connection
   string (same value as your local `.env`). That's all Vercel needs — the app
   talks to Postgres through the pooled connection at runtime.
4. Deploy. The build runs `prisma generate && next build`.

> **Migrations & seeding** are run from your machine against the same Neon
> database (local and production share one Neon project). You already applied the
> schema and seeded users during local setup, so production is ready immediately.
> To ship a future schema change: `npm run db:migrate` locally, commit the new
> file in `prisma/migrations/`, then redeploy.

## Scripts

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the dev server                         |
| `npm run build`      | Generate client, apply migrations, build     |
| `npm run db:migrate` | Create/apply a migration in development      |
| `npm run db:deploy`  | Apply pending migrations (production)        |
| `npm run db:seed`    | Seed the three users                         |
| `npm run db:studio`  | Open Prisma Studio                           |

## Supported upload types

`.txt` and `.md` only. Markdown is converted to HTML with `marked`, then loaded
into the editor. (`.docx` is intentionally out of scope.)
