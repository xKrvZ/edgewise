import { ApiStatus } from "@/components/api-status";
import { API_URL } from "@/lib/api";

export default function Home() {
  const docsUrl = `${API_URL}/reference`;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <ApiStatus />

        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
          Platform Monorepo
        </h1>

        <p className="max-w-xl text-balance text-lg text-zinc-400">
          A <span className="text-zinc-200">Next.js</span> frontend and a{" "}
          <span className="text-zinc-200">NestJS</span> backend, living together
          in one Bun workspace.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            View API docs
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
          >
            Next.js docs
          </a>
        </div>

        <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-left">
            <p className="text-sm font-medium text-zinc-200">apps/web</p>
            <p className="mt-1 text-sm text-zinc-500">
              Next.js App Router · localhost:3000
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-left">
            <p className="text-sm font-medium text-zinc-200">apps/api</p>
            <p className="mt-1 text-sm text-zinc-500">
              NestJS · localhost:3001/api
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
