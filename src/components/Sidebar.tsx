"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import CreateProjectModal from "./CreateProjectModal";
import { phaseConfig } from "@/lib/constants";

type Project = { id: string; name: string; phase: string };
type User = { name: string; role: string; systemRole: string };

const projectGradients = [
  "from-indigo-500 to-violet-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-fuchsia-500",
];

function getGradient(name: string) {
  const code = name.charCodeAt(0) % projectGradients.length;
  return projectGradients[code];
}

export default function Sidebar({
  projects,
  user,
  onNavigate,
}: {
  projects: Project[];
  user: User;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      href: "/team",
      label: "Team",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const avatarIdx = user.name.charCodeAt(0) % 6;
  const [loggingOut, startLogout] = useTransition();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/[0.06] bg-[#111318]/90 text-slate-400 backdrop-blur-2xl backdrop-saturate-150">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-base font-bold text-white shadow-lg shadow-violet-500/30">
          A
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">ArchSync</p>
          <p className="text-[11px] text-slate-500">Studio Dhaka</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-white/[0.08] text-white before:absolute before:left-0 before:top-2 before:h-[calc(100%-16px)] before:w-[3px] before:rounded-full before:bg-indigo-400 before:shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Projects */}
        <div>
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Projects
            </p>
            {user.systemRole !== "employee" && <CreateProjectModal />}
          </div>
          <div className="space-y-1">
            {projects.map((project) => {
              const active = pathname === `/projects/${project.id}`;
              const gradient = getGradient(project.name);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    active
                      ? "bg-white/[0.08] text-white before:absolute before:left-0 before:top-2 before:h-[calc(100%-16px)] before:w-[3px] before:rounded-full before:bg-indigo-400 before:shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-[11px] font-bold text-white shadow-md shadow-black/30 ring-1 ring-white/10`}>
                    {project.name[0]}
                  </span>
                  <span className="flex-1 truncate">{project.name}</span>
                  {phaseConfig[project.phase] && (
                    <span className={`ml-auto flex-shrink-0 rounded px-1 py-px text-[10px] font-bold ${phaseConfig[project.phase].color} text-white`}>
                      {phaseConfig[project.phase].short}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <div className={`avatar-gradient-${avatarIdx} flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-1 ring-white/10`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-200">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.role}
              {user.systemRole !== "employee" && (
                <span className={`ml-1.5 inline-block rounded px-1 py-px text-[10px] font-semibold uppercase ${
                  user.systemRole === "admin"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-indigo-500/15 text-indigo-400"
                }`}>
                  {user.systemRole === "admin" ? "Admin" : "PM"}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => startLogout(() => logoutAction())}
            className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300 disabled:opacity-50"
            title="Sign out"
          >
            {loggingOut ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
