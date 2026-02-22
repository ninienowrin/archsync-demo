import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import KanbanBoard from "@/components/KanbanBoard";
import ProjectSettings from "@/components/ProjectSettings";
import ProjectDescription from "@/components/ProjectDescription";
import ProjectTabs from "@/components/ProjectTabs";
import ProjectMembers from "@/components/ProjectMembers";
import ProjectDashboard from "@/components/ProjectDashboard";
import { PROJECT_PHASES, tagColors } from "@/lib/constants";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const systemRole = session?.systemRole ?? "employee";

  const [project, allUsers, projectMembers, projectActivities] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, role: true } },
            comments: {
              include: { author: { select: { id: true, name: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, role: true } } },
    }),
    prisma.activity.findMany({
      where: { projectId: id },
      include: {
        user: { select: { name: true } },
        task: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  if (!project) notFound();

  const serializedTasks = project.tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    comments: t.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  }));

  // ── Task stats ──
  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === "done").length;
  const inProg = project.tasks.filter((t) => t.status === "in_progress").length;
  const review = project.tasks.filter((t) => t.status === "review").length;
  const backlog = project.tasks.filter((t) => t.status === "backlog").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Hours stats ──
  const totalHours = project.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const completedHours = project.tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const remainingHours = totalHours - completedHours;

  const now = new Date();
  const overdue = project.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  ).length;

  // ── Unique assignees (for header avatars) ──
  const assignees = Array.from(
    new Map(
      project.tasks
        .filter((t) => t.assignee)
        .map((t) => [t.assignee!.id, t.assignee!])
    ).values()
  );

  // ── Discipline tag counts ──
  const disciplineCounts: Record<string, number> = {};
  for (const task of project.tasks) {
    for (const tag of task.tags) {
      disciplineCounts[tag] = (disciplineCounts[tag] || 0) + 1;
    }
  }
  const topDisciplines = Object.entries(disciplineCounts)
    .sort((a, b) => b[1] - a[1]);

  // ── Phase stepper ──
  const currentPhaseIdx = PROJECT_PHASES.findIndex((p) => p.value === project.phase);

  // ── Per-member contribution stats ──
  const memberContributions = projectMembers.map((pm) => {
    const memberTasks = project.tasks.filter((t) => t.assigneeId === pm.user.id);
    const memberTotal = memberTasks.length;
    const memberDone = memberTasks.filter((t) => t.status === "done").length;
    const memberInProgress = memberTasks.filter((t) => t.status === "in_progress").length;
    const memberReview = memberTasks.filter((t) => t.status === "review").length;
    const memberBacklog = memberTasks.filter((t) => t.status === "backlog").length;
    const memberTotalHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
    const memberCompletedHours = memberTasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);

    return {
      id: pm.user.id,
      name: pm.user.name,
      role: pm.user.role,
      projectRole: pm.role,
      totalTasks: memberTotal,
      doneTasks: memberDone,
      inProgressTasks: memberInProgress,
      reviewTasks: memberReview,
      backlogTasks: memberBacklog,
      completionRate: memberTotal > 0 ? Math.round((memberDone / memberTotal) * 100) : 0,
      totalHours: memberTotalHours,
      completedHours: memberCompletedHours,
    };
  });

  // ── Serialized activities for dashboard ──
  const serializedActivities = projectActivities.map((a) => ({
    id: a.id,
    action: a.action,
    details: a.details,
    createdAt: a.createdAt.toISOString(),
    user: a.user,
    task: a.task,
  }));

  // ── Upcoming deadlines ──
  const deadlines = project.tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!.toISOString(),
      status: t.status,
      assignee: t.assignee,
    }));

  // ── Dashboard props ──
  const projectStats = {
    total,
    done,
    inProgress: inProg,
    review,
    backlog,
    overdue,
    completionRate: progress,
    totalHours,
    completedHours,
    remainingHours,
  };

  const distribution = { done, review, in_progress: inProg, backlog };

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-indigo-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Project Header Card */}
      <div className="mb-6 relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {project.name}
            </h1>
            <ProjectDescription text={project.description} />
          </div>

          {/* Assignee avatars + settings */}
          <div className="flex items-center gap-3">
          {systemRole !== "employee" && (
            <ProjectSettings
              project={{ id: project.id, name: project.name, description: project.description, status: project.status, phase: project.phase }}
              systemRole={systemRole}
            />
          )}
          <div className="flex -space-x-2">
            {assignees.slice(0, 4).map((a) => {
              const initials = a.name
                .split(" ")
                .map((n) => n[0])
                .join("");
              const avatarIdx = a.name.charCodeAt(0) % 6;
              return (
                <div
                  key={a.id}
                  title={a.name}
                  className={`avatar-gradient-${avatarIdx} flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-sm`}
                >
                  {initials}
                </div>
              );
            })}
            {assignees.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-500">
                +{assignees.length - 4}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Phase stepper */}
        <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
          {PROJECT_PHASES.map((phase, idx) => {
            const isCurrent = idx === currentPhaseIdx;
            const isPast = idx < currentPhaseIdx;
            return (
              <div key={phase.value} className="flex items-center">
                {idx > 0 && (
                  <div className={`h-0.5 w-10 ${isPast ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
                <div
                  title={phase.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isCurrent
                      ? `${phase.color} text-white shadow-md ring-2 ring-white`
                      : isPast
                        ? "bg-emerald-100 text-emerald-600 shadow-sm"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isPast ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    phase.short
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Discipline tags */}
        {topDisciplines.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topDisciplines.map(([tag, count]) => {
              const tc = tagColors[tag] || { bg: "bg-slate-100", text: "text-slate-600" };
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tc.bg} ${tc.text}`}
                >
                  {tag}
                  <span className="rounded-full bg-white/60 px-1 text-[10px] font-semibold">
                    {count}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Mini stat row */}
        <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <MiniStat label="Backlog" value={backlog} color="bg-slate-400" />
            <MiniStat label="In Progress" value={inProg} color="bg-blue-500" />
            <MiniStat label="Review" value={review} color="bg-amber-500" />
            <MiniStat label="Done" value={done} color="bg-emerald-500" />
            {overdue > 0 && (
              <MiniStat label="Overdue" value={overdue} color="bg-red-500" />
            )}
            {totalHours > 0 && (
              <>
                <span className="hidden sm:inline text-slate-200">|</span>
                <MiniStat label="Total Hours" value={totalHours} color="bg-violet-500" />
                <MiniStat label="Done" value={completedHours} color="bg-emerald-500" />
                <MiniStat label="Remaining" value={remainingHours} color="bg-blue-500" />
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-lg font-extrabold text-slate-800 metric-value">
              {progress}%
            </span>
            <div className="h-3 w-28 overflow-hidden rounded-full bg-slate-100 shadow-inner sm:w-40">
              <div className="flex h-full">
                {done > 0 && (
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${(done / total) * 100}%` }}
                  />
                )}
                {review > 0 && (
                  <div
                    className="bg-amber-400"
                    style={{ width: `${(review / total) * 100}%` }}
                  />
                )}
                {inProg > 0 && (
                  <div
                    className="bg-blue-400"
                    style={{ width: `${(inProg / total) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed content: Board | Dashboard | Members */}
      <ProjectTabs
        board={
          <KanbanBoard
            initialTasks={serializedTasks}
            projectId={project.id}
            members={allUsers}
          />
        }
        dashboard={
          <ProjectDashboard
            stats={projectStats}
            distribution={distribution}
            memberContributions={memberContributions}
            disciplines={topDisciplines}
            activities={serializedActivities}
            deadlines={deadlines}
          />
        }
        members={
          <ProjectMembers
            projectId={project.id}
            members={memberContributions}
            allUsers={allUsers}
            systemRole={systemRole}
          />
        }
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const display = Number.isInteger(value) ? value : value.toFixed(1);
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-slate-500">
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-700">{display}</span>
    </div>
  );
}
