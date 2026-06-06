# AGENTS.md — Platform Monorepo

A Bun-workspaces monorepo with a clear split between backend and frontend. Keep concerns in the right app.

## Golden rule

- **Backend functionality lives in `apps/api`** (NestJS). All business logic, APIs, WebSockets, auth, database access, jobs, and server-side concerns go here.
- **Frontend lives in `apps/web`** (Next.js). UI, pages, components, and client-side concerns go here. The web app talks to the backend over HTTP — it must not contain backend/business logic or access the database directly.

If a change spans both, do the backend work in `apps/api`, expose it via the API, then consume it from `apps/web`.

## Layout

```
platform/
├── apps/
│   ├── api/   # NestJS backend  → http://localhost:3001/api
│   └── web/   # Next.js frontend → http://localhost:3000
├── docker-compose.yml   # Local infra (Postgres, Redis, MinIO, etc.)
├── biome.json           # Shared formatter/linter config
└── package.json         # Workspace root + orchestration scripts
```

## Per-app guidance

- `apps/api` — follow the NestJS conventions in the root `.cursorrules` (Controllers → Services → DAOs, error-handling rules, Swagger docs).
- `apps/web` — see `apps/web/AGENTS.md` for frontend conventions.

Read the relevant app's guidance before working in it.

## Commands (run from repo root)

- `bun install` — install all workspace dependencies
- `bun run dev` — run both apps together (watch mode)
- `bun run dev:api` / `bun run dev:web` — run a single app
- `bun run build` — build both apps
- Target a single workspace: `bun run --filter '@platform/api' <script>` or `--filter '@platform/web'`

## Conventions

- **Package manager:** Bun. Add deps within the owning workspace (`cd apps/<app> && bun add <pkg>`), not at the root, unless the dependency is genuinely shared tooling.
- **TypeScript 5** across the monorepo — keep versions aligned to avoid dual-install issues.
- **Env files are per-app:** `apps/api/.env` and `apps/web/.env` (copy from each `.env.example`). The frontend only reads `NEXT_PUBLIC_*` vars; secrets belong to the backend.
- **API boundary:** the frontend reaches the backend via its public URL (`NEXT_PUBLIC_API_URL`, default `http://localhost:3001/api`). Never import backend code into the frontend.
