import { statusLabels, tagColors, timeAgo } from "@/lib/constants";

type MemberContribution = {
  id: string;
  name: string;
  role: string;
  projectRole: string;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  backlogTasks: number;
  completionRate: number;
};

type ProjectStats = {
  total: number;
  done: number;
  inProgress: number;
  review: number;
  backlog: number;
  overdue: number;
  completionRate: number;
};

type Activity = {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  user: { name: string } | null;
  task: { title: string } | null;
};

type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  assignee: { name: string } | null;
};

export default function ProjectDashboard({
  stats,
  distribution,
  memberContributions,
  disciplines,
  activities,
  deadlines,
}: {
  stats: ProjectStats;
  distribution: { done: number; review: number; in_progress: number; backlog: number };
  memberContributions: MemberContribution[];
  disciplines: [string, number][];
  activities: Activity[];
  deadlines: Deadline[];
}) {
  const maxDisciplineCount = disciplines.length > 0 ? disciplines[0][1] : 1;
  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Tasks" value={stats.total} sub={`${stats.completionRate}% complete`} accent="indigo" />
        <MetricCard label="Completed" value={stats.done} sub={`of ${stats.total} tasks`} accent="emerald" />
        <MetricCard label="In Progress" value={stats.inProgress} sub={`${stats.review} in review`} accent="blue" />
        <MetricCard
          label="Overdue"
          value={stats.overdue}
          sub={stats.overdue > 0 ? "needs attention" : "all on track"}
          accent={stats.overdue > 0 ? "red" : "emerald"}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left: Charts */}
        <div className="space-y-6">
          {/* Task distribution donut */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Task Distribution</h3>
            <div className="mb-5 flex justify-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background:
                    stats.total > 0
                      ? `conic-gradient(
                          #10b981 0deg ${(distribution.done / stats.total) * 360}deg,
                          #f59e0b ${(distribution.done / stats.total) * 360}deg ${((distribution.done + distribution.review) / stats.total) * 360}deg,
                          #3b82f6 ${((distribution.done + distribution.review) / stats.total) * 360}deg ${((distribution.done + distribution.review + distribution.in_progress) / stats.total) * 360}deg,
                          #cbd5e1 ${((distribution.done + distribution.review + distribution.in_progress) / stats.total) * 360}deg 360deg
                        )`
                      : "#e2e8f0",
                }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-lg shadow-black/5 ring-1 ring-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 metric-value">{stats.total}</span>
                  <span className="text-[10px] font-medium text-slate-400">tasks</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {(
                [
                  ["done", "Completed", "bg-emerald-500"],
                  ["review", "In Review", "bg-amber-500"],
                  ["in_progress", "In Progress", "bg-blue-500"],
                  ["backlog", "Backlog", "bg-slate-300"],
                ] as const
              ).map(([key, label, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-700">
                    {distribution[key]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Discipline breakdown */}
          {disciplines.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Disciplines</h3>
              <div className="space-y-2.5">
                {disciplines.map(([tag, count]) => {
                  const tc = tagColors[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                  const widthPct = Math.max((count / maxDisciplineCount) * 100, 6);
                  return (
                    <div key={tag}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`rounded-full px-1.5 py-[1px] text-[10px] font-medium ${tc.bg} ${tc.text}`}>
                          {tag}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100/80">
                        <div
                          className={`h-full rounded-full transition-all ${tc.bg}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right: Members + Activity + Deadlines */}
        <div className="space-y-6">
          {/* Member contributions */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Team Contributions</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {memberContributions.map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("");
                const avatarIdx = member.name.charCodeAt(0) % 6;
                return (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className={`avatar-gradient-${avatarIdx} flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{member.name}</p>
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                        {member.doneTasks > 0 && (
                          <div
                            className="bg-emerald-500"
                            style={{
                              width: member.totalTasks > 0 ? `${(member.doneTasks / member.totalTasks) * 100}%` : "0%",
                            }}
                          />
                        )}
                        {member.reviewTasks > 0 && (
                          <div
                            className="bg-amber-400"
                            style={{
                              width: member.totalTasks > 0 ? `${(member.reviewTasks / member.totalTasks) * 100}%` : "0%",
                            }}
                          />
                        )}
                        {member.inProgressTasks > 0 && (
                          <div
                            className="bg-blue-400"
                            style={{
                              width: member.totalTasks > 0 ? `${(member.inProgressTasks / member.totalTasks) * 100}%` : "0%",
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 text-[10px]">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">
                        {member.doneTasks}
                      </span>
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-600">
                        {member.inProgressTasks}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">
                        {member.totalTasks}
                      </span>
                    </div>
                  </div>
                );
              })}
              {memberContributions.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No members yet</p>
              )}
            </div>
          </section>

          {/* Upcoming deadlines */}
          {deadlines.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {deadlines.map((task) => {
                  const due = new Date(task.dueDate);
                  const isOverdue = due < now && task.status !== "done";
                  const dateStr = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                          isOverdue ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {due.getDate()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">{task.title}</p>
                        {task.assignee && (
                          <p className="text-xs text-slate-400">{task.assignee.name}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-xs font-medium ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                        {isOverdue ? "Overdue" : dateStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Activity feed */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {activities.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No recent activity</p>
              )}
              {activities.map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <p className="text-sm leading-snug text-slate-600">
                    {formatActivity(activity)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {timeAgo(new Date(activity.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Metric Card ──────────────────────────────────────── */

function MetricCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <div className={`hover-lift group relative overflow-hidden rounded-2xl p-5 shadow-lg metric-card-${accent}`}>
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
      <p className="relative text-sm font-medium text-white/80">{label}</p>
      <p className="relative mt-1.5 text-3xl font-extrabold tracking-tight metric-value text-white">{value}</p>
      <p className="relative mt-0.5 text-xs text-white/60">{sub}</p>
    </div>
  );
}

/* ── Activity Formatter ───────────────────────────────── */

function formatActivity(activity: Activity) {
  const userName = activity.user?.name?.split(" ")[0] ?? "Someone";
  const taskTitle = activity.task?.title;
  const details = activity.details as Record<string, any> | null;

  switch (activity.action) {
    case "task.status_changed":
      return `${userName} moved "${taskTitle}" to ${statusLabels[details?.to] ?? details?.to}`;
    case "task.created":
      return `${userName} created "${details?.title ?? taskTitle}"`;
    case "task.updated":
      return `${userName} updated "${details?.title ?? taskTitle}"`;
    case "task.deleted":
      return `${userName} deleted "${details?.title}"`;
    case "comment.added":
      return `${userName} commented on "${taskTitle}"`;
    case "member.added":
      return `${userName} added a member`;
    case "member.removed":
      return `${userName} removed a member`;
    default:
      return `${userName} performed an action`;
  }
}
