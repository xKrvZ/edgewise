# AGENTS.md — `@platform/web`

Next.js frontend for the platform monorepo. This file gives agents the context needed to work in `apps/web`.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS v4** (configured via `@tailwindcss/postcss`; no `tailwind.config` file — theme lives in `app/globals.css`)
- **Biome** for lint/format (config at the repo root `biome.json`)
- **Bun** as the package manager/runtime

## Layout

```
app/          # App Router routes (layout.tsx, page.tsx, globals.css)
components/   # Reusable React components
lib/          # Shared client utilities (e.g. api.ts)
```

The `@/*` path alias resolves to the `apps/web` root (e.g. `@/lib/api`, `@/components/...`).

## Commands

Run from `apps/web` (or use `bun run --filter '@platform/web' <script>` from the repo root):

- `bun run dev` — dev server on `http://localhost:3000`
- `bun run build` — production build
- `bun run start` — serve the production build
- `bun run lint` — Biome lint + autofix

Do not edit `next-env.d.ts` or anything under `.next/` (generated).

## Conventions

- **Server Components by default.** Only add `"use client"` when a file needs hooks, state, effects, or browser APIs. Keep client components small and push them to the leaves of the tree.
- **API access:** never hardcode the backend URL. Import `API_URL` from `@/lib/api`, which reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001/api`). The NestJS backend is mounted under the `/api` prefix.
- **Auth:** use the Better Auth client from `@/lib/auth-client` (`signIn`, `signUp`, `signOut`, `useSession`, etc.) — do not call auth endpoints by hand. It points at the backend's Better Auth instance (`NEXT_PUBLIC_AUTH_URL`, default origin `http://localhost:3001`; the client appends `/api/auth`). Keep its plugins in sync with the backend (`apps/api/src/auth`): currently `adminClient`, `emailOTPClient`, `jwtClient`. `useSession` is client-side only, so components that read it must be `"use client"`.
- **Env vars:** anything used in the browser must be prefixed `NEXT_PUBLIC_`. Document new vars in `.env.example`.
- **Styling:** use Tailwind utility classes. Define design tokens/global styles in `app/globals.css` (Tailwind v4 `@theme`), not a JS config.
- **Components:** functional components only; colocate a component with its types. Extract reusable logic into hooks under `components/` or `lib/`.
- **Imports:** prefer the `@/` alias over deep relative paths.

## When adding features

1. Add the route under `app/` (App Router file conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
2. Fetch backend data through `@/lib/api`; prefer fetching in Server Components where possible.
3. Keep interactive bits in `"use client"` components.
4. Run `bun run build` to verify types and the production build before finishing.
