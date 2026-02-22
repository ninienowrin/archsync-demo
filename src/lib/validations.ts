import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["backlog", "in_progress", "review", "done"]).default("backlog"),
  assigneeId: z.string().min(1).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["backlog", "in_progress", "review", "done"]),
  assigneeId: z.string().nullable(),
  dueDate: z.string().nullable(),
  tags: z.array(z.string()).default([]),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["backlog", "in_progress", "review", "done"]),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  phase: z.enum(["schematic_design", "design_development", "construction_docs", "bidding", "construction_admin"]).default("schematic_design"),
});

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  status: z.enum(["active", "planning", "on_hold", "completed", "archived"]),
  phase: z.enum(["schematic_design", "design_development", "construction_docs", "bidding", "construction_admin"]).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.string().min(1).max(50),
});

export const createCommentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().min(1).max(5000),
});
