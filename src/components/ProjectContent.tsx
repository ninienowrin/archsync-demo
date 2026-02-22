"use client";

import { useState, useEffect, useMemo } from "react";
import KanbanBoard from "./KanbanBoard";
import ProjectDashboard from "./ProjectDashboard";
import ProjectMembers from "./ProjectMembers";
import ProjectTabs from "./ProjectTabs";

type Member = { id: string; name: string; role: string };

type Comment = {
  id: string;
  body: string;
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  tags: string[];
  estimatedHours: number | null;
  dueDate: string | null;
  position: number;
  projectId: string;
  assignee: Member | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
};

type ProjectMemberInfo = {
  userId: string;
  name: string;
  role: string;
  projectRole: string;
};

type Activity = {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  user: { name: string } | null;
  task: { title: string } | null;
};

export default function ProjectContent({
  initialTasks,
  projectId,
  members,
  projectMembers,
  activities,
  systemRole,
}: {
  initialTasks: Task[];
  projectId: string;
  members: Member[];
  projectMembers: ProjectMemberInfo[];
  activities: Activity[];
  systemRole: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Sync with server data when router.refresh() delivers fresh props
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Compute all stats from current task state — updates instantly on optimistic changes
  const computed = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const backlog = tasks.filter((t) => t.status === "backlog").length;
    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
    ).length;
    const totalHours = tasks.reduce(
      (sum, t) => sum + (t.estimatedHours ?? 0),
      0
    );
    const completedHours = tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
    const remainingHours = totalHours - completedHours;

    const stats = {
      total,
      done,
      inProgress,
      review,
      backlog,
      overdue,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      totalHours,
      completedHours,
      remainingHours,
    };

    const distribution = { done, review, in_progress: inProgress, backlog };

    // Member contributions
    const memberContributions = projectMembers.map((pm) => {
      const memberTasks = tasks.filter((t) => t.assigneeId === pm.userId);
      const mt = memberTasks.length;
      const md = memberTasks.filter((t) => t.status === "done").length;
      const mip = memberTasks.filter(
        (t) => t.status === "in_progress"
      ).length;
      const mr = memberTasks.filter((t) => t.status === "review").length;
      const mb = memberTasks.filter((t) => t.status === "backlog").length;
      const mth = memberTasks.reduce(
        (sum, t) => sum + (t.estimatedHours ?? 0),
        0
      );
      const mch = memberTasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);

      return {
        id: pm.userId,
        name: pm.name,
        role: pm.role,
        projectRole: pm.projectRole,
        totalTasks: mt,
        doneTasks: md,
        inProgressTasks: mip,
        reviewTasks: mr,
        backlogTasks: mb,
        completionRate: mt > 0 ? Math.round((md / mt) * 100) : 0,
        totalHours: mth,
        completedHours: mch,
      };
    });

    // Discipline tag counts
    const disciplineCounts: Record<string, number> = {};
    for (const task of tasks) {
      for (const tag of task.tags) {
        disciplineCounts[tag] = (disciplineCounts[tag] || 0) + 1;
      }
    }
    const disciplines: [string, number][] = Object.entries(
      disciplineCounts
    ).sort((a, b) => b[1] - a[1]);

    // Upcoming deadlines
    const deadlines = tasks
      .filter((t) => t.dueDate && t.status !== "done")
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      )
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate!,
        status: t.status,
        assignee: t.assignee,
      }));

    return { stats, distribution, memberContributions, disciplines, deadlines };
  }, [tasks, projectMembers]);

  return (
    <ProjectTabs
      board={
        <KanbanBoard
          tasks={tasks}
          setTasks={setTasks}
          projectId={projectId}
          members={members}
        />
      }
      dashboard={
        <ProjectDashboard
          stats={computed.stats}
          distribution={computed.distribution}
          memberContributions={computed.memberContributions}
          disciplines={computed.disciplines}
          activities={activities}
          deadlines={computed.deadlines}
        />
      }
      members={
        <ProjectMembers
          projectId={projectId}
          members={computed.memberContributions}
          allUsers={members}
          systemRole={systemRole}
        />
      }
    />
  );
}
