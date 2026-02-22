"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createUser } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function AddMemberForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createUser(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Member
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Member
      </button>

      <div
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
        onClick={() => { setOpen(false); setError(null); }}
      >
        <div
          className="modal-content w-full max-w-md rounded-2xl bg-white/[0.97] shadow-2xl ring-1 ring-black/[0.06] backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <form action={handleSubmit}>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Team Member
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Invite a new member to Studio Dhaka
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. Karim Hassan"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="karim@studiodhaka.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  name="role"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="" disabled>
                    Select a role...
                  </option>
                  <option value="Lead Architect">Lead Architect</option>
                  <option value="Architect">Architect</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Design Coordinator">Design Coordinator</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100/80"
              >
                Cancel
              </button>
              <AddMemberSubmitButton />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function AddMemberSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Adding...
        </span>
      ) : "Add Member"}
    </button>
  );
}
