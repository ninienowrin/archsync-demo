"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06080f]">
      {/* Grid pattern overlay */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0" />

      {/* Animated gradient blobs */}
      <div className="animate-gradient-blob pointer-events-none absolute -left-32 -top-32 h-[700px] w-[700px] rounded-full bg-indigo-600/30 blur-[120px]" />
      <div className="animate-gradient-blob-delayed pointer-events-none absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="animate-gradient-blob-slow pointer-events-none absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[100px]" />
      <div className="animate-gradient-blob-delayed pointer-events-none absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-pink-600/10 blur-[100px]" />

      <div className="animate-fade-in-up relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-3xl font-bold text-white shadow-2xl shadow-indigo-500/50 ring-1 ring-white/20">
            A
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ArchSync</h1>
          <p className="mt-2 text-sm text-slate-400">
            Project Management for Architecture Teams
          </p>
        </div>

        {/* Login form */}
        <form
          action={formAction}
          className="rounded-2xl border border-white/[0.12] bg-white/[0.06] p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-all focus-within:border-white/[0.2] focus-within:shadow-indigo-500/10"
        >
          <h2 className="mb-6 text-lg font-semibold text-white">
            Sign in to your account
          </h2>

          {state?.error && (
            <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/30">
              {state.error}
            </div>
          )}

          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="rahim@studiodhaka.com"
              className="w-full rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-400/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-indigo-500/30 focus:shadow-lg focus:shadow-indigo-500/10"
              placeholder="you@company.com"
            />
          </div>

          <div className="mb-7">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="demo1234"
              className="w-full rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-400/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-indigo-500/30 focus:shadow-lg focus:shadow-indigo-500/10"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/40 ring-1 ring-white/10 transition-all hover:from-indigo-500 hover:via-indigo-400 hover:to-violet-400 hover:shadow-2xl hover:shadow-indigo-500/50 hover:ring-white/20 active:scale-[0.97] disabled:opacity-40"
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Signing in...
              </span>
            ) : "Sign in"}
          </button>

          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Demo credentials
            </p>
            <p className="text-xs text-slate-500">
              Email: rahim@studiodhaka.com
            </p>
            <p className="text-xs text-slate-500">Password: demo1234</p>
          </div>
        </form>
      </div>
    </div>
  );
}
