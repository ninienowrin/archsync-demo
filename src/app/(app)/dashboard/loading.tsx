export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 rounded bg-slate-200" />
        </div>
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>

      {/* Metric cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-3 h-4 w-20 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: My Tasks */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 h-5 w-28 rounded bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                <div className="h-4 w-4 rounded bg-slate-200" />
                <div className="h-4 flex-1 rounded bg-slate-200" />
                <div className="h-5 w-14 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Activity feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 h-5 w-32 rounded bg-slate-200" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="mt-1 h-3 w-16 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deadlines */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 h-5 w-36 rounded bg-slate-200" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-10 rounded bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-3.5 w-32 rounded bg-slate-200" />
                    <div className="mt-1 h-3 w-20 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
