"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { KanbanColumn, KanbanTask, KanbanBoard } from "@/lib/types";
import { KanbanColumn as ColumnComponent } from "./Column";
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";
import { Plus, RefreshCw, Loader2, Search } from "lucide-react";

type FilterState = {
  search: string;
  priority: string;
  assignee: string;
  tag: string;
};

export function Board() {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ search: "", priority: "", assignee: "", tag: "" });
  const recurringChecked = useRef(false);
  const dragTaskRef = useRef<KanbanTask | null>(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kanban");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // Check recurring tasks once on mount
  useEffect(() => {
    if (!recurringChecked.current && board) {
      recurringChecked.current = true;
      fetch("/api/kanban/recurring", { method: "POST" }).catch(() => {});
    }
  }, [board]);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create");
    await fetchBoard();
  };

  const handleUpdate = async (taskId: string, data: any) => {
    const res = await fetch(`/api/kanban/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update");
    await fetchBoard();
  };

  const handleDelete = async (taskId: string) => {
    const res = await fetch(`/api/kanban/${taskId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    await fetchBoard();
  };

  const handleExecute = async (taskId: string) => {
    setExecutingId(taskId);
    try {
      const res = await fetch("/api/kanban/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Execute failed:", err.error);
      }
      await fetchBoard();
    } catch (err) {
      console.error("Execute error:", err);
    } finally {
      setExecutingId(null);
    }
  };

  const handleDragStart = (task: KanbanTask) => {
    dragTaskRef.current = task;
  };

  const handleDrop = async (columnId: string) => {
    const task = dragTaskRef.current;
    if (!task || task.columnId === columnId) return;
    dragTaskRef.current = null;
    await handleUpdate(task.id, { columnId });
  };

  // Filter tasks
  const filteredTasks = (board?.tasks || []).filter((t) => {
    if (t.archived && !showArchived) return false;
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) && !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee && t.assignee !== filters.assignee) return false;
    if (filters.tag && !t.tags.some((tag) => tag.toLowerCase().includes(filters.tag.toLowerCase()))) return false;
    return true;
  });

  // Get unique tags from all tasks
  const allTags = [...new Set((board?.tasks || []).flatMap((t) => t.tags))];

  // Get unique assignees
  const allAssignees = [...new Set((board?.tasks || []).filter((t) => t.assigneeName).map((t) => t.assigneeName!))];

  if (loading && !board) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchBoard} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Retry</button>
      </div>
    );
  }

  const columns = board?.columns || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Kanban</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search tasks..."
                className="w-48 pl-8 pr-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              className="px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {allAssignees.length > 0 && (
              <select
                value={filters.assignee}
                onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
                className="px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="">All Assignees</option>
                {allAssignees.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-2 py-1.5 rounded-lg border text-xs transition-colors ${showArchived ? "bg-blue-600/10 text-blue-400 border-blue-500/30" : "bg-transparent"}`}
            style={{ color: showArchived ? undefined : "var(--text-secondary)", borderColor: "var(--border)" }}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          <button onClick={fetchBoard} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-secondary)" }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditTask(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-0" style={{ minHeight: 400 }}>
          {columns.map((col) => {
            const colTasks = filteredTasks
              .filter((t) => t.columnId === col.id)
              .sort((a, b) => a.order - b.order);

            return (
              <ColumnComponent
                key={col.id}
                column={col}
                tasks={colTasks}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onTaskClick={setSelectedTask}
                onEditTask={(task) => { setEditTask(task); setShowForm(true); }}
                onDeleteTask={handleDelete}
                onExecute={handleExecute}
                executingId={executingId}
              />
            );
          })}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editTask}
          columns={columns}
          allTasks={board?.tasks || []}
          onSave={async (data) => {
            try {
              if (editTask) {
                await handleUpdate(editTask.id, data);
              } else {
                await handleCreate(data);
              }
              setShowForm(false);
              setEditTask(null);
            } catch (err) {
              throw err;
            }
          }}
          onClose={() => { setShowForm(false); setEditTask(null); }}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(task) => { setSelectedTask(null); setEditTask(task); setShowForm(true); }}
          onDelete={async (id) => { await handleDelete(id); setSelectedTask(null); }}
          onArchive={async (id) => { await handleUpdate(id, { archived: true }); setSelectedTask(null); }}
        />
      )}
    </div>
  );
}
