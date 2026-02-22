"use client";

import { useState, useTransition } from "react";
import { addProjectMember, removeProjectMember } from "@/app/actions";
import { memberRoleConfig } from "@/lib/constants";

type MemberStats = {
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

type SimpleUser = { id: string; name: string; role: string };

export default function ProjectMembers({
  projectId,
  members,
  allUsers,
  systemRole,
}: {
  projectId: string;
  members: MemberStats[];
  allUsers: SimpleUser[];
  systemRole: string;
}) {
  const canManage = systemRole === "admin" || systemRole === "project_manager";
  const [isPending, startTransition] = useTransition();
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("member");

  // Users not yet in this project
  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  function handleAdd() {
    if (!addUserId) return;
    startTransition(async () => {
      await addProjectMember(projectId, addUserId, addRole);
      setAddUserId("");
      setAddRole("member");
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeProjectMember(projectId, userId);
    });
  }

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      await addProjectMember(projectId, userId, newRole);
    });
  }

  return (
    <div className="space-y-6">
      {/* Add member form */}
      {canManage && availableUsers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Add Team Member</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">Person</label>
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select a team member...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-500">Project Role</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={!addUserId || isPending}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50 active:scale-[0.98]"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Member grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const initials = member.name
            .split(" ")
            .map((n) => n[0])
            .join("");
          const avatarIdx = member.name.charCodeAt(0) % 6;
          const roleInfo = memberRoleConfig[member.projectRole] ?? memberRoleConfig.member;
          const isOwner = member.projectRole === "owner";

          return (
            <div
              key={member.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              {/* Accent strip */}
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-40" />

              <div className="p-5">
                {/* Header: avatar + info + actions */}
                <div className="flex items-start gap-3">
                  <div
                    className={`avatar-gradient-${avatarIdx} flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md ring-1 ring-white/20`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{member.name}</p>
                    <p className="truncate text-xs text-slate-500">{member.role}</p>
                  </div>

                  {/* Role badge / dropdown */}
                  {canManage && !isOwner ? (
                    <select
                      value={member.projectRole}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={isPending}
                      className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold outline-none ${roleInfo.color}`}
                    >
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4">
                  {/* Progress bar */}
                  {member.totalTasks > 0 ? (
                    <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
                      {member.doneTasks > 0 && (
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${(member.doneTasks / member.totalTasks) * 100}%` }}
                        />
                      )}
                      {member.reviewTasks > 0 && (
                        <div
                          className="bg-amber-400"
                          style={{ width: `${(member.reviewTasks / member.totalTasks) * 100}%` }}
                        />
                      )}
                      {member.inProgressTasks > 0 && (
                        <div
                          className="bg-blue-400"
                          style={{ width: `${(member.inProgressTasks / member.totalTasks) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mb-2 h-2 rounded-full bg-slate-100" />
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{member.totalTasks} tasks</span>
                    <span>{member.completionRate}% done</span>
                  </div>

                  {/* Stat chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                      {member.doneTasks} done
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                      {member.inProgressTasks} active
                    </span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                      {member.reviewTasks} review
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {member.backlogTasks} backlog
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                {canManage && !isOwner && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={isPending}
                    className="mt-3 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Remove from project
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">No members assigned to this project yet.</p>
        </div>
      )}
    </div>
  );
}
