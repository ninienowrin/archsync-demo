"use client";

import { useState } from "react";
import { createProject } from "@/app/actions";
import { PROJECT_PHASES } from "@/lib/constants";
import { useModalA11y } from "@/lib/useModalA11y";

export default function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const modalRef = useModalA11y(open, () => setOpen(false));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-slate-300"
        title="New project"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-slate-300"
        title="New project"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Modal */}
      <div
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
        onClick={() => setOpen(false)}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-modal-title"
          className="modal-content w-full max-w-md rounded-2xl bg-white/[0.97] shadow-2xl ring-1 ring-black/[0.06] backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <form action={createProject}>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 id="create-project-modal-title" className="text-lg font-semibold text-slate-900">
                New Project
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Create a new architecture project
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Project Name
                </label>
                <input
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. Banani Office Tower"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of the project scope..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phase
                </label>
                <select
                  name="phase"
                  defaultValue="schematic_design"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {PROJECT_PHASES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.short} — {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-500 active:scale-[0.98]"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
