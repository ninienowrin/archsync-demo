import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import AddMemberForm from "@/components/AddMemberForm";
import { statusDotColors as statusDot, statusLabels as statusLabel } from "@/lib/constants";

export default async function TeamPage() {
  const session = await getSession();
  const members = await prisma.user.findMany({
    include: {
      tasks: {
        select: { id: true, status: true, title: true, projectId: true },
        where: { status: { not: "done" } },
        orderBy: { updatedAt: "desc" },
        take: 3,
      },
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get per-status counts separately
  const memberStats = await prisma.user.findMany({
    select: {
      id: true,
      tasks: { select: { status: true } },
    },
  });

  const statsMap = new Map(
    memberStats.map((m) => [
      m.id,
      {
        total: m.tasks.length,
        backlog: m.tasks.filter((t) => t.status === "backlog").length,
        in_progress: m.tasks.filter((t) => t.status === "in_progress").length,
        review: m.tasks.filter((t) => t.status === "review").length,
        done: m.tasks.filter((t) => t.status === "done").length,
      },
    ])
  );


  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="mt-1 text-sm text-slate-500">
            {members.length} members working on Studio Dhaka projects
          </p>
        </div>
        {session?.systemRole === "admin" && <AddMemberForm />}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {members.map((member) => {
          const initials = member.name
            .split(" ")
            .map((n) => n[0])
            .join("");
          const avatarIdx = member.name.charCodeAt(0) % 6;
          const stats = statsMap.get(member.id) ?? {
            total: 0, backlog: 0, in_progress: 0, review: 0, done: 0,
          };
          const completionRate =
            stats.total > 0
              ? Math.round((stats.done / stats.total) * 100)
              : 0;

          return (
            <div
              key={member.id}
              className="hover-lift overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
            >
              {/* Accent strip */}
              <div className="h-0.5 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-transparent" />
              {/* Header */}
              <div className="flex items-center gap-4 p-5 pb-0">
                <div className={`avatar-gradient-${avatarIdx} flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white shadow-md shadow-black/10`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 metric-value">
                    {completionRate}%
                  </p>
                  <p className="text-xs text-slate-400">completed</p>
                </div>
              </div>

              {/* Stats bar */}
              <div className="px-5 py-4">
                <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
                  {stats.done > 0 && (
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${(stats.done / stats.total) * 100}%` }}
                    />
                  )}
                  {stats.review > 0 && (
                    <div
                      className="bg-amber-400"
                      style={{ width: `${(stats.review / stats.total) * 100}%` }}
                    />
                  )}
                  {stats.in_progress > 0 && (
                    <div
                      className="bg-blue-400"
                      style={{ width: `${(stats.in_progress / stats.total) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{stats.backlog} backlog</span>
                  <span>{stats.in_progress} active</span>
                  <span>{stats.review} review</span>
                  <span>{stats.done} done</span>
                </div>
              </div>

              {/* Active tasks */}
              {member.tasks.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Current tasks
                  </p>
                  <div className="space-y-1.5">
                    {member.tasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/projects/${task.projectId}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50/60"
                      >
                        <span
                          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${statusDot[task.status]}`}
                        />
                        <span className="truncate text-xs text-slate-600">
                          {task.title}
                        </span>
                        <span className="ml-auto flex-shrink-0 text-[10px] text-slate-400">
                          {statusLabel[task.status]}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
