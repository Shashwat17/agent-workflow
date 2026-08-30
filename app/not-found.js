import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-400">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The page you’re looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Back to workflow</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
