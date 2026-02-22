"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { updateTaskStatus, createTask, updateTask, deleteTask, addComment } from "@/app/actions";
import { useToast } from "@/components/ToastProvider";
import { useModalA11y } from "@/lib/useModalA11y";

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
  dueDate: string | null;
  position: number;
  projectId: string;
  assignee: Member | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
};

import {
  AVAILABLE_TAGS,
  tagColors,
  kanbanColumns as columns,
  priorityCard as priorityConfig,
  statusLabels,
  timeAgo,
} from "@/lib/constants";

export default function KanbanBoard({
  initialTasks,
  projectId,
  members,
}: {
  initialTasks: Task[];
  projectId: string;
  members: Member[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    toast(`Task moved to ${statusLabels[newStatus] || newStatus}`);
    updateTaskStatus(taskId, newStatus);
  }

  async function handleCreateTask(formData: FormData) {
    const status = formData.get("status") as string;
    const title = formData.get("title") as string;

    // Optimistic add FIRST for instant feedback
    const tempId = "temp-" + Date.now();
    const tempTask: Task = {
      id: tempId,
      title,
      description: null,
      status,
      priority: (formData.get("priority") as string) || "medium",
      tags: formData.getAll("tags") as string[],
      dueDate: null,
      position: tasks.length,
      projectId,
      assignee: null,
      assigneeId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, tempTask]);
    setAddingToColumn(null);

    // Server action AFTER optimistic update
    try {
      await createTask(formData);
      toast("Task created");
    } catch {
      // Roll back on failure
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      toast("Failed to create task", "error");
    }
  }

  async function handleUpdateTask(formData: FormData) {
    const taskId = formData.get("taskId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const status = formData.get("status") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const dueDate = formData.get("dueDate") as string;
    const tags = formData.getAll("tags") as string[];

    const assignee = assigneeId
      ? members.find((m) => m.id === assigneeId) ?? null
      : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, title, description, priority, status, assigneeId, assignee, dueDate: dueDate || null, tags }
          : t
      )
    );
    setSelectedTask(null);
    toast("Task updated");
    await updateTask(formData);
  }

  async function handleDeleteTask() {
    if (!selectedTask) return;
    setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    setSelectedTask(null);
    toast("Task deleted");
    await deleteTask(selectedTask.id, projectId);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <DroppableColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                bg={col.bg}
                count={columnTasks.length}
                onAddClick={() => setAddingToColumn(col.id)}
              >
                {columnTasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    isDragging={activeTask?.id === task.id}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}

                {addingToColumn === col.id && (
                  <InlineAddTask
                    projectId={projectId}
                    status={col.id}
                    onSubmit={handleCreateTask}
                    onCancel={() => setAddingToColumn(null)}
                  />
                )}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          members={members}
          onClose={() => setSelectedTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </>
  );
}

/* ── Column ─────────────────────────────────────────── */

function DroppableColumn({
  id,
  title,
  color,
  bg,
  count,
  children,
  onAddClick,
}: {
  id: string;
  title: string;
  color: string;
  bg: string;
  count: number;
  children: React.ReactNode;
  onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${title} column, ${count} tasks`}
      className={`flex min-h-[500px] flex-col rounded-xl border border-slate-200/50 border-t-4 p-3 transition-all ${color} ${bg} ${
        isOver ? "ring-2 ring-indigo-300/60 bg-indigo-50/40 scale-[1.01]" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200/80 px-1.5 text-xs font-medium text-slate-500">
            {count}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 active:scale-95"
          title="Add task"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

/* ── Inline Add ─────────────────────────────────────── */

function InlineAddTask({
  projectId,
  status,
  onSubmit,
  onCancel,
}: {
  projectId: string;
  status: string;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={onSubmit}
      className="rounded-xl border-2 border-dashed border-indigo-200/60 bg-white/80 p-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="status" value={status} />
      <input
        ref={inputRef}
        name="title"
        required
        autoFocus
        placeholder="Task title..."
        className="mb-2 w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center gap-2">
        <select
          name="priority"
          defaultValue="medium"
          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 active:scale-95 shadow-sm shadow-indigo-500/20"
        >
          Add
        </button>
      </div>
    </form>
  );
}

/* ── Draggable Task ─────────────────────────────────── */

function DraggableTask({
  task,
  isDragging,
  onClick,
}: {
  task: Task;
  isDragging: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={0}
      role="button"
      aria-roledescription="draggable task"
      aria-label={task.title}
      className={isDragging ? "dragging" : ""}
      onClick={(e) => {
        // Only open modal if not dragging
        if (!transform) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <TaskCard task={task} />
    </div>
  );
}

/* ── Task Card ──────────────────────────────────────── */

function TaskCard({ task, overlay }: { task: Task; overlay?: boolean }) {
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const initials = task.assignee
    ? task.assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : null;

  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const priorityBorder =
    task.priority === "high" ? "card-priority-high" :
    task.priority === "medium" ? "card-priority-medium" : "card-priority-low";

  const avatarIdx = task.assignee ? task.assignee.name.charCodeAt(0) % 6 : 0;

  return (
    <div
      className={`hover-lift cursor-grab rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ${priorityBorder} ${
        overlay ? "drag-overlay" : ""
      }`}
    >
      <p className="mb-2 text-sm font-medium text-slate-800">{task.title}</p>
      {task.description && (
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
          {task.description}
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => {
            const tc = tagColors[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
            return (
              <span
                key={tag}
                className={`rounded-full px-1.5 py-[1px] text-[10px] font-medium ring-1 ring-inset ring-current/10 ${tc.bg} ${tc.text}`}
              >
                {tag}
              </span>
            );
          })}
          {task.tags.length > 3 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-[1px] text-[10px] font-medium text-slate-500">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priority.className}`}>
            {priority.label}
          </span>
          {dueDate && (
            <span className={`text-[10px] ${isOverdue ? "pulse-overdue font-medium text-red-500" : "text-slate-400"}`}>
              {dueDate}
            </span>
          )}
        </div>
        {initials && (
          <div
            className={`avatar-gradient-${avatarIdx} flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white shadow-sm`}
            title={task.assignee!.name}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Task Modal ─────────────────────────────────────── */

function TaskModal({
  task,
  projectId,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  projectId: string;
  members: Member[];
  onClose: () => void;
  onSave: (formData: FormData) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(task.tags);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useModalA11y(true, onClose);

  // Close tag dropdown on outside click
  useEffect(() => {
    if (!tagDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagDropdownOpen]);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/[0.06] backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <form action={onSave}>
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="projectId" value={projectId} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 id="task-modal-title" className="text-lg font-semibold text-slate-900">Edit Task</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                name="title"
                required
                defaultValue={task.title}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={task.description ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={task.status}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue={task.priority}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Assignee
                </label>
                <select
                  name="assigneeId"
                  defaultValue={task.assigneeId ?? ""}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={task.dueDate ? task.dueDate.split("T")[0] : ""}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Discipline Tags
              </label>
              {/* Hidden inputs for selected tags */}
              {selectedTags.map((tag) => (
                <input key={tag} type="hidden" name="tags" value={tag} />
              ))}
              {/* Selected tags display */}
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {selectedTags.map((tag) => {
                  const tc = tagColors[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-75 ${tc.bg} ${tc.text}`}
                    >
                      {tag}
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  );
                })}
              </div>
              {/* Tag dropdown */}
              <div className="relative" ref={tagDropdownRef}>
                <button
                  type="button"
                  onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-500 outline-none transition-colors hover:border-slate-300 focus:border-indigo-400"
                >
                  {selectedTags.length === 0 ? "Add tags..." : "Add more tags..."}
                </button>
                {tagDropdownOpen && (
                  <div className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {AVAILABLE_TAGS.filter((t) => !selectedTags.includes(t)).map((tag) => {
                      const tc = tagColors[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedTags((prev) => [...prev, tag]);
                            setTagDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50"
                        >
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tc.bg} ${tc.text}`}>
                            {tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Comments
                {task.comments && task.comments.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    ({task.comments.length})
                  </span>
                )}
              </label>
              <div className="max-h-40 space-y-2.5 overflow-y-auto">
                {(!task.comments || task.comments.length === 0) && (
                  <p className="py-2 text-xs text-slate-400">No comments yet</p>
                )}
                {task.comments?.map((comment) => {
                  const initials = comment.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  const avatarIdx = comment.author.name.charCodeAt(0) % 6;
                  return (
                    <div key={comment.id} className="flex gap-2">
                      <div className={`avatar-gradient-${avatarIdx} flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-slate-700">{comment.author.name}</span>
                          <span className="text-[10px] text-slate-400">{timeAgo(new Date(comment.createdAt))}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{comment.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Comment input — separate from main form */}
          <div className="border-t border-slate-100 px-6 py-3">
            <form
              action={async (formData: FormData) => {
                formData.set("taskId", task.id);
                await addComment(formData);
              }}
              className="flex gap-2"
            >
              <input
                name="body"
                required
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                Send
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete this task?</span>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 active:scale-[0.98] shadow-sm shadow-indigo-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
