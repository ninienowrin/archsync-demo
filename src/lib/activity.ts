import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

type LogActivityParams = {
  action: string;
  projectId: string;
  userId: string;
  taskId?: string;
  details?: Prisma.InputJsonValue;
};

export async function logActivity({
  action,
  projectId,
  userId,
  taskId,
  details,
}: LogActivityParams) {
  return prisma.activity.create({
    data: { action, projectId, userId, taskId, details },
  });
}
