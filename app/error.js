"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-900/80 p-8 shadow-2xl shadow-red-950/20 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-red-400">
          Error
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {error?.message ||
            "An unexpected issue occurred while loading this page."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
