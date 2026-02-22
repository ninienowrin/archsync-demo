import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  statusLabels,
  statusDotColors as statusDot,
  priorityBadge,
  projectStatusConfig,
  phaseConfig,
  memberRoleConfig,
  timeAgo,
} from "@/lib/constants";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  // Access control: admins can view anyone, others can only view themselves
  const isAdmin = session.systemRole === "admin";
  if (!isAdmin && session.id !== id) redirect("/dashboard");

  const [member, tasks, memberships, activities, comments] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        systemRole: true,
        createdAt: true,
      },
    }),
    prisma.task.findMany({
      where: { assigneeId: id },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.projectMember.findMany({
      where: { userId: id },
      include: {
        project: {
          select: { id: true, name: true, status: true, phase: true },
        },
      },
    }),
    prisma.activity.findMany({
      where: { userId: id },
      include: {
        project: { select: { name: true } },
        task: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.comment.findMany({
      where: { authorId: id },
      include: {
        task: { select: { id: true, title: true, projectId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!member) notFound();

  // ── Task stats ──
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const reviewTasks = tasks.filter((t) => t.status === "review").length;
  const backlogTasks = tasks.filter((t) => t.status === "backlog").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  ).length;

  // ── Hours stats ──
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const completedHours = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);

  // ── Split tasks ──
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasksList = tasks.filter((t) => t.status === "done");

  // ── Tasks per project ──
  const projectTaskCounts = new Map<string, number>();
  for (const t of tasks) {
    projectTaskCounts.set(t.projectId, (projectTaskCounts.get(t.projectId) ?? 0) + 1);
  }

  // ── Priority breakdown ──
  const priorityCounts = {
    high: tasks.filter((t) => t.priority === "high" && t.status !== "done").length,
    medium: tasks.filter((t) => t.priority === "medium" && t.status !== "done").length,
    low: tasks.filter((t) => t.priority === "low" && t.status !== "done").length,
  };

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const avatarIdx = member.name.charCodeAt(0) % 6;

  const memberSince = new Date(member.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isSelf = session.id === id;

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      {isAdmin && (
        <Link
          href="/team"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-indigo-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Team
        </Link>
      )}

      {/* Header Card */}
      <div className="mb-6 relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div
            className={`avatar-gradient-${avatarIdx} flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg shadow-black/15 ring-2 ring-white`}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {member.name}
              </h1>
              {isSelf && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-100">
                  You
                </span>
              )}
              {member.systemRole !== "employee" && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  member.systemRole === "admin"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}>
                  {member.systemRole === "admin" ? "Admin" : "PM"}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{member.role}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {member.email} &middot; Member since {memberSince}
            </p>
          </div>

          {/* Completion ring */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: totalTasks > 0
                  ? `conic-gradient(#10b981 0deg ${completionRate * 3.6}deg, #e2e8f0 ${completionRate * 3.6}deg 360deg)`
                  : "#e2e8f0",
              }}
            >
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-100">
                <span className="text-xl font-extrabold text-slate-900 metric-value">{completionRate}%</span>
              </div>
            </div>
            <span className="text-[10px] font-medium text-slate-400">completion</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Tasks" value={totalTasks} accent="indigo" />
        <StatCard label="Completed" value={doneTasks} accent="emerald" />
        <StatCard label="In Progress" value={inProgressTasks} accent="blue" />
        <StatCard label="Overdue" value={overdueTasks} accent={overdueTasks > 0 ? "red" : "emerald"} />
        {totalHours > 0 && (
          <>
            <StatCard label="Total Hours" value={totalHours} accent="violet" isHours />
            <StatCard label="Hours Done" value={completedHours} accent="emerald" isHours />
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left — 2/3 */}
        <div className="space-y-6 xl:col-span-2">
          {/* Current Tasks */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Current Tasks</h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 ring-1 ring-blue-100">
                  {activeTasks.length}
                </span>
              </div>
              {/* Priority pills */}
              <div className="hidden items-center gap-1.5 sm:flex">
                {priorityCounts.high > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-red-100">
                    {priorityCounts.high} high
                  </span>
                )}
                {priorityCounts.medium > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-100">
                    {priorityCounts.medium} medium
                  </span>
                )}
                {priorityCounts.low > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {priorityCounts.low} low
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {activeTasks.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No active tasks</p>
              )}
              {activeTasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < now;
                return (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.id}`}
                    className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-slate-50/50"
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot[task.status]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-400">{task.project.name}</p>
                    </div>
                    {task.estimatedHours != null && (
                      <span className="flex-shrink-0 text-[10px] text-slate-400">{task.estimatedHours}h</span>
                    )}
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityBadge[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="flex-shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {statusLabels[task.status]}
                    </span>
                    {isOverdue && (
                      <span className="flex-shrink-0 text-[10px] font-medium text-red-500">Overdue</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Completed Tasks */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Completed Tasks</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                  {completedTasksList.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {completedTasksList.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No completed tasks yet</p>
              )}
              {completedTasksList.slice(0, 15).map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-slate-50/50"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-600">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.project.name}</p>
                  </div>
                  {task.estimatedHours != null && (
                    <span className="flex-shrink-0 text-[10px] text-slate-400">{task.estimatedHours}h</span>
                  )}
                  <span className="flex-shrink-0 text-xs text-slate-400">
                    {new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
              {completedTasksList.length > 15 && (
                <p className="px-6 py-3 text-center text-xs text-slate-400">
                  +{completedTasksList.length - 15} more completed tasks
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-6">
          {/* Projects */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Projects</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {memberships.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">Not assigned to any projects</p>
              )}
              {memberships.map((pm) => {
                const pConfig = projectStatusConfig[pm.project.status] ?? projectStatusConfig.active;
                const phaseCfg = phaseConfig[pm.project.phase] ?? null;
                const roleInfo = memberRoleConfig[pm.role] ?? memberRoleConfig.member;
                const taskCount = projectTaskCounts.get(pm.projectId) ?? 0;

                return (
                  <Link
                    key={pm.id}
                    href={`/projects/${pm.project.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/50"
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${pConfig.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{pm.project.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {phaseCfg && (
                          <span className={`rounded px-1 py-px text-[10px] font-bold ${phaseCfg.color} text-white`}>
                            {phaseCfg.short}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{taskCount} tasks</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Comments */}
          {comments.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-900">Recent Comments</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {comments.slice(0, 8).map((comment) => (
                  <Link
                    key={comment.id}
                    href={comment.task ? `/projects/${comment.task.projectId}` : "#"}
                    className="block px-5 py-3 transition-colors hover:bg-slate-50/50"
                  >
                    <p className="text-sm text-slate-600 line-clamp-2">{comment.body}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      {comment.task && (
                        <span className="truncate">on &ldquo;{comment.task.title}&rdquo;</span>
                      )}
                      <span className="flex-shrink-0">&middot; {timeAgo(new Date(comment.createdAt))}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Activity Timeline */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Activity Timeline</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {activities.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No activity yet</p>
              )}
              {activities.map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <ActivityIcon action={activity.action} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-600 leading-snug">
                        {formatActivity(activity)}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        {activity.project && <span>{activity.project.name}</span>}
                        <span>&middot; {timeAgo(new Date(activity.createdAt))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────── */

function StatCard({
  label,
  value,
  accent,
  isHours,
}: {
  label: string;
  value: number;
  accent: string;
  isHours?: boolean;
}) {
  const display = isHours
    ? Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`
    : value;

  return (
    <div className={`hover-lift relative overflow-hidden rounded-2xl p-5 shadow-lg metric-card-${accent}`}>
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
      <p className="relative text-xs font-medium text-white/80">{label}</p>
      <p className="relative mt-1 text-2xl font-extrabold tracking-tight text-white metric-value">{display}</p>
    </div>
  );
}

/* ── Activity Icon ──────────────────────────────────── */

function ActivityIcon({ action }: { action: string }) {
  const base = "mt-0.5 h-4 w-4 flex-shrink-0";
  if (action.startsWith("task.status"))
    return <svg className={`${base} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>;
  if (action === "task.created")
    return <svg className={`${base} text-emerald-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
  if (action === "comment.added")
    return <svg className={`${base} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
  if (action.includes("deleted"))
    return <svg className={`${base} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
  return <svg className={`${base} text-slate-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" /></svg>;
}

/* ── Activity Formatter ─────────────────────────────── */

function formatActivity(activity: {
  action: string;
  details: any;
  task: { title: string } | null;
}) {
  const taskTitle = activity.task?.title;
  const details = activity.details as Record<string, any> | null;

  switch (activity.action) {
    case "task.status_changed":
      return `Moved "${taskTitle}" to ${statusLabels[details?.to] ?? details?.to}`;
    case "task.created":
      return `Created "${details?.title ?? taskTitle}"`;
    case "task.updated":
      return `Updated "${details?.title ?? taskTitle}"`;
    case "task.deleted":
      return `Deleted "${details?.title}"`;
    case "comment.added":
      return `Commented on "${taskTitle}"`;
    case "member.added":
      return "Added a member to a project";
    case "member.removed":
      return "Removed a member from a project";
    case "project.created":
      return `Created project "${details?.name}"`;
    case "project.updated":
      return `Updated project "${details?.name}"`;
    case "project.archived":
      return "Archived a project";
    default:
      return "Performed an action";
  }
}
