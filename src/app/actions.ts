"use server";

import { prisma } from "@/lib/prisma";
import { login as authLogin, destroySession, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createProjectSchema,
  updateProjectSchema,
  createUserSchema,
  createCommentSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Helpers ────────────────────────────────────────────

async function requireRole(...roles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!roles.includes(session.systemRole)) {
    throw new Error("Insufficient permissions");
  }
  return session;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ── Auth actions ──────────────────────────────────────

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const result = await authLogin(email, password);
  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ── Task actions ──────────────────────────────────────

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const session = await requireAuth();
  const parsed = updateTaskStatusSchema.parse({ taskId, status: newStatus });

  const task = await prisma.task.findUnique({
    where: { id: parsed.taskId },
    select: { status: true, projectId: true },
  });
  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: parsed.taskId },
    data: { status: parsed.status },
  });

  await logActivity({
    action: "task.status_changed",
    projectId: task.projectId,
    taskId: parsed.taskId,
    userId: session.id,
    details: { from: task.status, to: parsed.status },
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/dashboard");
}

export async function createTask(formData: FormData) {
  const session = await requireAuth();
  const parsed = createTaskSchema.parse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "backlog",
    assigneeId: formData.get("assigneeId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    estimatedHours: formData.get("estimatedHours") || undefined,
    tags: formData.getAll("tags"),
  });

  const dueDate = parsed.dueDate ? new Date(parsed.dueDate) : undefined;

  const maxPosition = await prisma.task.aggregate({
    where: { projectId: parsed.projectId, status: parsed.status },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      status: parsed.status,
      projectId: parsed.projectId,
      assigneeId: parsed.assigneeId || null,
      dueDate,
      estimatedHours: parsed.estimatedHours ?? null,
      tags: parsed.tags,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  await logActivity({
    action: "task.created",
    projectId: parsed.projectId,
    taskId: task.id,
    userId: session.id,
    details: { title: parsed.title },
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath("/dashboard");
}

export async function updateTask(formData: FormData) {
  const session = await requireAuth();
  const parsed = updateTaskSchema.parse({
    taskId: formData.get("taskId"),
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    priority: formData.get("priority"),
    status: formData.get("status"),
    assigneeId: formData.get("assigneeId") || null,
    dueDate: formData.get("dueDate") || null,
    estimatedHours: formData.get("estimatedHours") || null,
    tags: formData.getAll("tags"),
  });

  const dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;

  await prisma.task.update({
    where: { id: parsed.taskId },
    data: {
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      status: parsed.status,
      assigneeId: parsed.assigneeId,
      dueDate,
      estimatedHours: parsed.estimatedHours,
      tags: parsed.tags,
    },
  });

  await logActivity({
    action: "task.updated",
    projectId: parsed.projectId,
    taskId: parsed.taskId,
    userId: session.id,
    details: { title: parsed.title },
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string, projectId: string) {
  const session = await requireAuth();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true, projectId: true },
  });
  if (!task) throw new Error("Task not found");

  await prisma.task.delete({ where: { id: taskId } });

  await logActivity({
    action: "task.deleted",
    projectId: task.projectId,
    userId: session.id,
    details: { title: task.title },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

// ── Comment actions ───────────────────────────────────

export async function addComment(formData: FormData) {
  const session = await requireAuth();
  const parsed = createCommentSchema.parse({
    taskId: formData.get("taskId"),
    body: formData.get("body"),
  });

  const task = await prisma.task.findUnique({
    where: { id: parsed.taskId },
    select: { projectId: true },
  });
  if (!task) throw new Error("Task not found");

  await prisma.comment.create({
    data: {
      body: parsed.body,
      taskId: parsed.taskId,
      authorId: session.id,
    },
  });

  await logActivity({
    action: "comment.added",
    projectId: task.projectId,
    taskId: parsed.taskId,
    userId: session.id,
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/dashboard");
}

// ── Project actions ───────────────────────────────────

export async function createProject(formData: FormData) {
  const session = await requireRole("admin", "project_manager");
  const parsed = createProjectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    phase: formData.get("phase") || "schematic_design",
  });

  const project = await prisma.project.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      status: "active",
      phase: parsed.phase,
    },
  });

  // Auto-add creator as project owner
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: session.id, role: "owner" },
  });

  await logActivity({
    action: "project.created",
    projectId: project.id,
    userId: session.id,
    details: { name: parsed.name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(formData: FormData) {
  const session = await requireRole("admin", "project_manager");
  const parsed = updateProjectSchema.parse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    status: formData.get("status"),
    phase: formData.get("phase") || undefined,
  });

  await prisma.project.update({
    where: { id: parsed.projectId },
    data: {
      name: parsed.name,
      description: parsed.description,
      status: parsed.status,
      ...(parsed.phase ? { phase: parsed.phase } : {}),
    },
  });

  await logActivity({
    action: "project.updated",
    projectId: parsed.projectId,
    userId: session.id,
    details: { name: parsed.name, status: parsed.status },
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function archiveProject(projectId: string) {
  const session = await requireRole("admin", "project_manager");
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "archived" },
  });

  await logActivity({
    action: "project.archived",
    projectId,
    userId: session.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function deleteProject(projectId: string) {
  const session = await requireRole("admin");
  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ── Project member actions ────────────────────────────

export async function addProjectMember(projectId: string, userId: string, memberRole = "member") {
  const session = await requireRole("admin", "project_manager");

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, role: memberRole },
    update: { role: memberRole },
  });

  await logActivity({
    action: "member.added",
    projectId,
    userId: session.id,
    details: { addedUserId: userId, role: memberRole },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(projectId: string, userId: string) {
  const session = await requireRole("admin", "project_manager");

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  await logActivity({
    action: "member.removed",
    projectId,
    userId: session.id,
    details: { removedUserId: userId },
  });

  revalidatePath(`/projects/${projectId}`);
}

// ── User management actions ───────────────────────────

export async function createUser(formData: FormData) {
  await requireRole("admin");
  const bcrypt = await import("bcryptjs");
  const parsed = createUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    return { error: "A user with this email already exists" };
  }

  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      password: bcrypt.hashSync(parsed.password, 10),
      role: parsed.role,
    },
  });

  revalidatePath("/team");
}
