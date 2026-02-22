export default function ProjectLoading() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb */}
      <div className="mb-4 h-4 w-20 rounded bg-slate-200" />

      {/* Project header card */}
      <div className="mb-6 rounded-2xl border border-slate-200 border-t-4 border-t-indigo-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-6 w-56 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-96 rounded bg-slate-100" />
          </div>
          <div className="flex -space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
            ))}
          </div>
        </div>

        {/* Phase stepper skeleton */}
        <div className="mt-5 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && <div className="h-0.5 w-6 bg-slate-100" />}
              <div className="h-7 w-7 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Mini stat row skeleton */}
        <div className="mt-5 flex items-center gap-6">
          <div className="flex gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="h-4 w-8 rounded bg-slate-200" />
            <div className="h-2 w-32 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div key={colIdx} className="rounded-xl border border-slate-200 border-t-2 border-t-slate-300 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-5 w-5 rounded bg-slate-100" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: colIdx === 0 ? 3 : colIdx === 3 ? 2 : 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-12 rounded-full bg-slate-100" />
                    <div className="h-3 w-12 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
