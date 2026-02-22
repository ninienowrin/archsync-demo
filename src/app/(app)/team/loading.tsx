export default function TeamLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-48 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200" />
      </div>

      {/* Member cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="mt-1.5 h-3 w-20 rounded bg-slate-100" />
              </div>
              <div className="h-5 w-14 rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
              <div className="flex-1">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="mt-1 h-5 w-8 rounded bg-slate-200" />
              </div>
              <div className="flex-1">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="mt-1 h-5 w-8 rounded bg-slate-200" />
              </div>
              <div className="flex-1">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="mt-1 h-5 w-8 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
