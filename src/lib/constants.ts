// ── Shared constants for ArchSync ──────────────────────

// ── Task statuses ──

export const TASK_STATUSES = ["backlog", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

export const statusDotColors: Record<string, string> = {
  backlog: "bg-slate-400",
  in_progress: "bg-blue-500",
  review: "bg-amber-500",
  done: "bg-emerald-500",
};

// ── Task priorities ──

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const priorityBadge: Record<string, string> = {
  high: "bg-red-50 text-red-600 ring-red-100",
  medium: "bg-amber-50 text-amber-600 ring-amber-100",
  low: "bg-slate-50 text-slate-500 ring-slate-100",
};

export const priorityCard: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-700" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  low: { label: "Low", className: "bg-slate-100 text-slate-600" },
};

// ── Discipline tags ──

export const AVAILABLE_TAGS = [
  "structural",
  "architectural",
  "mechanical",
  "hvac",
  "electrical",
  "interior",
  "landscape",
  "materials",
  "safety",
  "compliance",
  "environmental",
  "sustainability",
  "surveying",
  "acoustic",
  "management",
  "finance",
  "engineering",
  "legal",
] as const;
export type Tag = (typeof AVAILABLE_TAGS)[number];

export const tagColors: Record<string, { bg: string; text: string }> = {
  structural:     { bg: "bg-blue-50",    text: "text-blue-700" },
  architectural:  { bg: "bg-violet-50",  text: "text-violet-700" },
  mechanical:     { bg: "bg-orange-50",  text: "text-orange-700" },
  hvac:           { bg: "bg-cyan-50",    text: "text-cyan-700" },
  electrical:     { bg: "bg-yellow-50",  text: "text-yellow-700" },
  interior:       { bg: "bg-pink-50",    text: "text-pink-700" },
  landscape:      { bg: "bg-green-50",   text: "text-green-700" },
  materials:      { bg: "bg-stone-100",  text: "text-stone-700" },
  safety:         { bg: "bg-red-50",     text: "text-red-700" },
  compliance:     { bg: "bg-amber-50",   text: "text-amber-700" },
  environmental:  { bg: "bg-emerald-50", text: "text-emerald-700" },
  sustainability: { bg: "bg-teal-50",    text: "text-teal-700" },
  surveying:      { bg: "bg-indigo-50",  text: "text-indigo-700" },
  acoustic:       { bg: "bg-purple-50",  text: "text-purple-700" },
  management:     { bg: "bg-slate-100",  text: "text-slate-700" },
  finance:        { bg: "bg-lime-50",    text: "text-lime-700" },
  engineering:    { bg: "bg-sky-50",     text: "text-sky-700" },
  legal:          { bg: "bg-rose-50",    text: "text-rose-700" },
};

// ── Project statuses ──

export const PROJECT_STATUSES = ["active", "planning", "on_hold", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projectStatusConfig: Record<string, { label: string; color: string }> = {
  active:    { label: "Active",    color: "bg-emerald-500" },
  planning:  { label: "Planning",  color: "bg-amber-500" },
  completed: { label: "Completed", color: "bg-slate-400" },
  on_hold:   { label: "On Hold",   color: "bg-red-500" },
  archived:  { label: "Archived",  color: "bg-slate-300" },
};

// ── Project phases (architecture-specific) ──

export const PROJECT_PHASES = [
  { value: "schematic_design",   label: "Schematic Design",   short: "SD", color: "bg-violet-500",  text: "text-violet-600" },
  { value: "design_development", label: "Design Development", short: "DD", color: "bg-blue-500",    text: "text-blue-600" },
  { value: "construction_docs",  label: "Construction Docs",  short: "CD", color: "bg-amber-500",   text: "text-amber-600" },
  { value: "bidding",            label: "Bidding & Negotiation", short: "BN", color: "bg-orange-500", text: "text-orange-600" },
  { value: "construction_admin", label: "Construction Admin", short: "CA", color: "bg-emerald-500", text: "text-emerald-600" },
] as const;

export type ProjectPhase = (typeof PROJECT_PHASES)[number]["value"];

export const phaseConfig: Record<string, { label: string; short: string; color: string; text: string }> = Object.fromEntries(
  PROJECT_PHASES.map((p) => [p.value, { label: p.label, short: p.short, color: p.color, text: p.text }])
);

// ── Project member roles ──

export const PROJECT_MEMBER_ROLES = [
  { value: "owner",   label: "Owner",   color: "bg-amber-100 text-amber-700" },
  { value: "manager", label: "Manager", color: "bg-indigo-100 text-indigo-700" },
  { value: "member",  label: "Member",  color: "bg-slate-100 text-slate-600" },
] as const;

export const memberRoleConfig: Record<string, { label: string; color: string }> = Object.fromEntries(
  PROJECT_MEMBER_ROLES.map((r) => [r.value, { label: r.label, color: r.color }])
);

// ── System roles ──

export const SYSTEM_ROLES = ["admin", "project_manager", "employee"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

// ── Kanban columns ──

export const kanbanColumns = [
  { id: "backlog",     title: "Backlog",     color: "border-t-slate-400",   bg: "bg-slate-50" },
  { id: "in_progress", title: "In Progress", color: "border-t-blue-500",    bg: "bg-blue-50/30" },
  { id: "review",      title: "Review",      color: "border-t-amber-500",   bg: "bg-amber-50/30" },
  { id: "done",        title: "Done",        color: "border-t-emerald-500", bg: "bg-emerald-50/30" },
] as const;

// ── Helpers ──

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
