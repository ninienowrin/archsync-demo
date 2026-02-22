import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import {
  statusLabels,
  statusDotColors as statusDot,
  priorityBadge,
  tagColors,
  projectStatusConfig,
  phaseConfig,
  timeAgo,
} from "@/lib/constants";
import EmptyState from "@/components/EmptyState";

/* ── Activity formatter ─────────────────────────────── */

function formatActivity(activity: any) {
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
    case "project.created":
      return `${userName} created project "${details?.name}"`;
    case "project.updated":
      return `${userName} updated project "${details?.name}"`;
    case "member.added":
      return `${userName} added a member`;
    default:
      return `${userName} performed an action`;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const role = session?.systemRole ?? "employee";
  const isEmployee = role === "employee";
  const isAdmin = role === "admin";

  const [projects, allTasks, members, myTasks, upcomingTasks, activities] =
    await Promise.all([
      prisma.project.findMany({
        include: {
          tasks: {
            select: { id: true, status: true, priority: true, assigneeId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.findMany({
        select: { id: true, status: true, priority: true, dueDate: true, assigneeId: true, tags: true },
      }),
      prisma.user.findMany({
        include: {
          tasks: { select: { id: true, status: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.task.findMany({
        where: { assigneeId: session?.id },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          tags: true,
          dueDate: true,
          updatedAt: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.task.findMany({
        where: {
          dueDate: { not: null },
          status: { not: "done" },
          // Non-admins only see their own deadlines
          ...(isAdmin ? {} : { assigneeId: session?.id }),
        },
        include: {
          assignee: { select: { name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 6,
      }),
      prisma.activity.findMany({
        where: isAdmin ? {} : { userId: session?.id },
        include: {
          user: { select: { name: true } },
          task: { select: { title: true } },
          project: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const now = new Date();

  // ── Scoped stats (admin = all tasks, PM/employee = my tasks) ──
  const scopedTasks = isAdmin
    ? allTasks
    : allTasks.filter((t) => t.assigneeId === session?.id);
  const totalTasks = scopedTasks.length;
  const doneTasks = scopedTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = scopedTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = scopedTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Task distribution for donut chart
  const distribution = {
    backlog: scopedTasks.filter((t) => t.status === "backlog").length,
    in_progress: inProgressTasks,
    review: scopedTasks.filter((t) => t.status === "review").length,
    done: doneTasks,
  };

  // ── Discipline counts ──
  const disciplineCount: Record<string, number> = {};
  scopedTasks.forEach((t: any) => {
    (t.tags ?? []).forEach((tag: string) => {
      disciplineCount[tag] = (disciplineCount[tag] || 0) + 1;
    });
  });
  const disciplineSorted = Object.entries(disciplineCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxDisciplineCount = disciplineSorted.length > 0 ? disciplineSorted[0][1] : 1;

  // My tasks grouped
  const myActive = myTasks.filter((t) => t.status !== "done");
  const myDone = myTasks.filter((t) => t.status === "done");

  // ── Filter active tasks by searchParams ──
  let filteredActive = myActive;
  if (params.priority) filteredActive = filteredActive.filter(t => t.priority === params.priority);
  if (params.tag) filteredActive = filteredActive.filter(t => t.tags.includes(params.tag!));

  // Non-admin: only show projects they're involved in
  const visibleProjects = isAdmin
    ? projects
    : projects.filter((p) => p.tasks.some((t) => t.assigneeId === session?.id));

  // My deadlines (for non-admin roles)
  const myOverdue = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  ).length;

  const greeting = getGreeting();

  // ── Role label for header ──
  const roleLabel = isAdmin ? "Admin" : role === "project_manager" ? "Project Manager" : null;

  // ── Collect unique tags and priorities for filter pills ──
  const allPriorities = Array.from(new Set(myActive.map((t) => t.priority)));
  const allTags = Array.from(new Set(myActive.flatMap((t) => t.tags)));

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting}, {session?.name.split(" ")[0]}
            </h1>
            {roleLabel && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isAdmin
                  ? "bg-amber-50 text-amber-600"
                  : "bg-indigo-50 text-indigo-600"
              }`}>
                {roleLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <p className="text-sm text-slate-400">
          {completionRate}% {isAdmin ? "overall" : "my"} completion
        </p>
      </div>

      {/* ── Metric Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <MetricCard
              label="Total Tasks"
              value={totalTasks}
              sub={`across ${projects.length} projects`}
              accent="indigo"
            />
            <MetricCard
              label="Team Members"
              value={members.length}
              sub={`${members.filter((m) => m.tasks.some((t) => t.status === "in_progress")).length} active now`}
              accent="blue"
            />
            <MetricCard
              label="Completed"
              value={doneTasks}
              sub={`${completionRate}% completion rate`}
              accent="emerald"
            />
            <MetricCard
              label="Overdue"
              value={overdueTasks}
              sub={overdueTasks > 0 ? "needs attention" : "all on track"}
              accent={overdueTasks > 0 ? "red" : "emerald"}
            />
          </>
        ) : (
          <>
            <MetricCard
              label="My Tasks"
              value={totalTasks}
              sub={`across ${visibleProjects.length} projects`}
              accent="indigo"
            />
            <MetricCard
              label="In Progress"
              value={inProgressTasks}
              sub={`${distribution.review} in review`}
              accent="blue"
            />
            <MetricCard
              label="Completed"
              value={doneTasks}
              sub={`${completionRate}% done`}
              accent="emerald"
            />
            <MetricCard
              label="Overdue"
              value={myOverdue}
              sub={myOverdue > 0 ? "needs attention" : "all on track"}
              accent={myOverdue > 0 ? "red" : "emerald"}
            />
          </>
        )}
      </div>

      {/* ── Main Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column — 2/3 width */}
        <div className="space-y-6 xl:col-span-2">
          {/* My Tasks */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">My Tasks</h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                  {filteredActive.length} active
                </span>
              </div>

              {/* ── Filter Pills ── */}
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {allPriorities.map((p) => {
                    const isActive = params.priority === p;
                    return (
                      <Link
                        key={p}
                        href={
                          isActive
                            ? `/dashboard${params.tag ? `?tag=${params.tag}` : ""}`
                            : `/dashboard?priority=${p}${params.tag ? `&tag=${params.tag}` : ""}`
                        }
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                  {allTags.map((tag) => {
                    const isActive = params.tag === tag;
                    const tc = tagColors[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                    return (
                      <Link
                        key={tag}
                        href={
                          isActive
                            ? `/dashboard${params.priority ? `?priority=${params.priority}` : ""}`
                            : `/dashboard?tag=${tag}${params.priority ? `&priority=${params.priority}` : ""}`
                        }
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          isActive
                            ? `${tc.bg} ${tc.text} ring-1 ring-current`
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {tag}
                      </Link>
                    );
                  })}
                  {(params.priority || params.tag) && (
                    <Link
                      href="/dashboard"
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50"
                    >
                      Clear
                    </Link>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {myDone.length} completed
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredActive.length === 0 && (
                <div className="px-6">
                  <EmptyState
                    icon="tasks"
                    title={params.priority || params.tag
                      ? "No tasks match the current filters"
                      : "No active tasks assigned to you"}
                    description="Tasks assigned to you will appear here"
                  />
                </div>
              )}
              {filteredActive.slice(0, 6).map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-slate-50/50"
                >
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot[task.status]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        {task.project.name}
                      </p>
                      {task.tags.length > 0 && (
                        <div className="flex gap-1">
                          {task.tags.slice(0, 2).map((tag) => {
                            const tc = tagColors[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                            return (
                              <span
                                key={tag}
                                className={`rounded-full px-1.5 py-[1px] text-[10px] font-medium ${tc.bg} ${tc.text}`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                          {task.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityBadge[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  <span className="flex-shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {statusLabels[task.status]}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Projects Overview */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4">
              <h2 className="font-semibold text-slate-900">
                {!isAdmin ? "My Projects" : "Projects"}
              </h2>
              <span className="text-xs text-slate-400">
                {visibleProjects.length} {!isAdmin ? "assigned" : "total"}
              </span>
            </div>
            <div className="p-6 space-y-5">
              {visibleProjects.length === 0 && (
                <EmptyState
                  icon="projects"
                  title="No projects yet"
                  description="Projects you're a member of will appear here"
                />
              )}
              {visibleProjects.map((project) => {
                // Employee: show only their tasks in the project
                const projectTasks = !isAdmin
                  ? project.tasks.filter((t) => t.assigneeId === session?.id)
                  : project.tasks;
                const total = projectTasks.length;
                const done = projectTasks.filter((t) => t.status === "done").length;
                const inProg = projectTasks.filter((t) => t.status === "in_progress").length;
                const review = projectTasks.filter((t) => t.status === "review").length;
                const backlog = projectTasks.filter((t) => t.status === "backlog").length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const pConfig = projectStatusConfig[project.status] ?? projectStatusConfig.active;
                const phaseCfg = phaseConfig[project.phase] ?? null;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 rounded-full ${pConfig.color}`} />
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                          {project.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {pConfig.label}
                        </span>
                        {phaseCfg && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${phaseCfg.color} ${phaseCfg.text}`}
                          >
                            {phaseCfg.short}
                          </span>
                        )}
                        {!isAdmin && (
                          <span className="text-[10px] text-slate-400">
                            · {total} {total === 1 ? "task" : "tasks"} assigned
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {pct}%
                      </span>
                    </div>

                    {/* Stacked progress bar */}
                    {total > 0 && (
                      <>
                        <div className="mb-1.5 flex h-2 overflow-hidden rounded-full bg-slate-100">
                          {done > 0 && (
                            <div
                              className="bg-emerald-500 transition-all"
                              style={{ width: `${(done / total) * 100}%` }}
                            />
                          )}
                          {review > 0 && (
                            <div
                              className="bg-amber-400 transition-all"
                              style={{ width: `${(review / total) * 100}%` }}
                            />
                          )}
                          {inProg > 0 && (
                            <div
                              className="bg-blue-400 transition-all"
                              style={{ width: `${(inProg / total) * 100}%` }}
                            />
                          )}
                        </div>

                        <div className="flex gap-4 text-xs text-slate-400">
                          <span>{backlog} backlog</span>
                          <span>{inProg} in progress</span>
                          <span>{review} review</span>
                          <span>{done} done</span>
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column — 1/3 width */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100/80 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Activity Feed</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {activities.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">
                  No recent activity
                </p>
              )}
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="px-5 py-3 transition-colors hover:bg-slate-50/50"
                >
                  <p className="text-sm text-slate-600 leading-snug">
                    {formatActivity(activity)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {timeAgo(new Date(activity.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Deadlines */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                {!isAdmin ? "My Deadlines" : "Deadlines"}
              </h2>
              {overdueTasks > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                  {overdueTasks} overdue
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {upcomingTasks.length === 0 && (
                <div className="px-5">
                  <EmptyState
                    icon="deadlines"
                    title="No upcoming deadlines"
                    description="Tasks with due dates will appear here"
                  />
                </div>
              )}
              {upcomingTasks.map((task) => {
                const due = task.dueDate!;
                const isOverdue = new Date(due) < now;
                const dateStr = new Date(due).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.id}`}
                    className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50/50"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                        isOverdue
                          ? "bg-red-50 text-red-500"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {new Date(due).getDate()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {task.project.name}
                        {isAdmin && task.assignee && ` · ${task.assignee.name}`}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs font-medium ${
                        isOverdue ? "text-red-500" : "text-slate-400"
                      }`}
                    >
                      {isOverdue ? "Overdue" : dateStr}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Task Distribution */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              {!isAdmin ? "My Task Distribution" : "Task Distribution"}
            </h2>
            {/* Donut chart via conic-gradient */}
            <div className="mb-5 flex justify-center">
              <div
                className="relative flex h-36 w-36 items-center justify-center rounded-full"
                style={{
                  background: totalTasks > 0
                    ? `conic-gradient(
                        #10b981 0deg ${(distribution.done / totalTasks) * 360}deg,
                        #f59e0b ${(distribution.done / totalTasks) * 360}deg ${((distribution.done + distribution.review) / totalTasks) * 360}deg,
                        #3b82f6 ${((distribution.done + distribution.review) / totalTasks) * 360}deg ${((distribution.done + distribution.review + distribution.in_progress) / totalTasks) * 360}deg,
                        #cbd5e1 ${((distribution.done + distribution.review + distribution.in_progress) / totalTasks) * 360}deg 360deg
                      )`
                    : "#e2e8f0",
                }}
              >
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <span className="text-2xl font-bold text-slate-900">
                    {totalTasks}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {!isAdmin ? "my tasks" : "tasks"}
                  </span>
                </div>
              </div>
            </div>
            {/* Legend */}
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
                  <span className="text-xs text-slate-500">
                    {label}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-slate-700">
                    {distribution[key]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Discipline Overview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Discipline Overview</h2>
            {disciplineSorted.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No discipline data yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {disciplineSorted.map(([tag, count]) => {
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
            )}
          </section>

          {/* Team Workload — Admin & PM only */}
          {!isEmployee && (
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100/80 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Team Workload</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {members.map((member, idx) => {
                  const total = member.tasks.length;
                  const active = member.tasks.filter(
                    (t) => t.status === "in_progress" || t.status === "review"
                  ).length;
                  const done = member.tasks.filter(
                    (t) => t.status === "done"
                  ).length;
                  const initials = member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  const avatarIdx = member.name.charCodeAt(0) % 6;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className={`avatar-gradient-${avatarIdx} flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {member.name}
                        </p>
                        {/* Mini stacked bar */}
                        <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                          {done > 0 && (
                            <div
                              className="bg-emerald-500"
                              style={{
                                width: total > 0 ? `${(done / total) * 100}%` : "0%",
                              }}
                            />
                          )}
                          {active > 0 && (
                            <div
                              className="bg-blue-500"
                              style={{
                                width: total > 0 ? `${(active / total) * 100}%` : "0%",
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-600">
                          {active}
                        </span>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">
                          {done}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Admin Quick Actions */}
          {isAdmin && (
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100/80 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Administration</h2>
              </div>
              <div className="p-5 space-y-3">
                <Link
                  href="/team"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Manage Team</p>
                    <p className="text-xs text-slate-400">{members.length} members</p>
                  </div>
                  <svg className="ml-auto h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{projects.length}</p>
                    <p className="text-[10px] text-slate-400">Projects</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{allTasks.length}</p>
                    <p className="text-[10px] text-slate-400">Total Tasks</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Metric Card ────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
}) {
  const accentMap: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    red: { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-100" },
  };
  const a = accentMap[accent] ?? accentMap.indigo;

  return (
    <div className="hover-lift group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Accent gradient glows */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08]"
        style={{ filter: "blur(24px)", background: accent === "red" ? "#ef4444" : accent === "emerald" ? "#10b981" : accent === "blue" ? "#3b82f6" : "#6366f1" }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-16 w-16 rounded-full opacity-[0.04]"
        style={{ filter: "blur(20px)", background: accent === "red" ? "#ef4444" : accent === "emerald" ? "#10b981" : accent === "blue" ? "#3b82f6" : "#6366f1" }}
      />
      <p className="relative text-sm text-slate-500">{label}</p>
      <p className={`relative mt-1 text-3xl font-bold tracking-tight metric-value ${a.text}`}>{value}</p>
      <p className="relative mt-1 text-xs text-slate-400/80">{sub}</p>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
