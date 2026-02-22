"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0d14]">
      {/* Background gradient accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/25 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-xl shadow-indigo-500/40">
            A
          </div>
          <h1 className="text-2xl font-bold text-white">ArchSync</h1>
          <p className="mt-1 text-sm text-slate-400">
            Project Management for Architecture Teams
          </p>
        </div>

        {/* Login form */}
        <form
          action={formAction}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl transition-all focus-within:border-white/[0.15]"
        >
          <h2 className="mb-6 text-lg font-semibold text-white">
            Sign in to your account
          </h2>

          {state?.error && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
              {state.error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="rahim@studiodhaka.com"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
              placeholder="you@company.com"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="demo1234"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-xl hover:shadow-indigo-500/35 active:scale-[0.97] disabled:opacity-40"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
            <p className="mb-1 text-xs font-medium text-slate-400">
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
