"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";

type Project = { id: string; name: string; phase: string };
type User = { name: string; role: string; systemRole: string };

export default function SidebarWrapper({
  projects,
  user,
}: {
  projects: Project[];
  user: User;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f1117] text-white shadow-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar projects={projects} user={user} />
      </div>

      {/* Mobile sidebar — slide-in overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

          {/* Sidebar panel */}
          <div
            className="relative h-full w-64 shadow-2xl shadow-black/30"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideRight 0.2s ease-out" }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Close sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Sidebar projects={projects} user={user} onNavigate={handleNavigate} />
          </div>
        </div>
      )}
    </>
  );
}
