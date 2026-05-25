"use client";

import { useState, useEffect } from "react";
import { KanbanTask, KanbanColumn } from "@/lib/types";
import { X } from "lucide-react";

interface TaskFormProps {
  task: KanbanTask | null;
  columns: KanbanColumn[];
  allTasks: KanbanTask[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export function TaskForm({ task, columns, allTasks, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(task?.acceptanceCriteria || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [columnId, setColumnId] = useState(task?.columnId || "backlog");
  const [assigneeName, setAssigneeName] = useState(task?.assigneeName || "");
  const [tagsInput, setTagsInput] = useState((task?.tags || []).join(", "));
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [recurring, setRecurring] = useState(task?.recurring?.enabled ? "daily" : "");
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description,
        acceptanceCriteria,
        priority,
        columnId,
        assigneeName: assigneeName.trim() || null,
        tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
        dueDate: dueDate || null,
        recurring: recurring ? { enabled: true, interval: recurring } : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="rounded-xl border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:border-blue-500"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:border-blue-500 resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              rows={3}
              placeholder="Detailed instructions for the task..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Acceptance Criteria</label>
            <textarea
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:border-blue-500 resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              rows={2}
              placeholder="What defines success?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Column</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Assignee</label>
            <select
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              placeholder="bug, frontend, sprint-1 (comma separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>Recurring</label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="">Not recurring</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
