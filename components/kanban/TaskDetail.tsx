"use client";

import { KanbanTask } from "@/lib/types";
import { X, Calendar, Archive, Trash2, Edit2, Clock, Tag, CheckCircle2 } from "lucide-react";

interface TaskDetailProps {
  task: KanbanTask;
  onClose: () => void;
  onEdit: (task: KanbanTask) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

const PRIORITY_INFO: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#3b82f6" },
  medium: { label: "Medium", color: "#eab308" },
  high: { label: "High", color: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

export function TaskDetail({ task, onClose, onEdit, onDelete, onArchive }: TaskDetailProps) {
  const priority = PRIORITY_INFO[task.priority] || PRIORITY_INFO.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const columnNames: Record<string, string> = {
    backlog: "Backlog", todo: "To Do", in_progress: "In Progress", in_review: "In Review", done: "Done",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="rounded-xl border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-base font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
              {task.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: priority.color + "20", color: priority.color }}>
                {priority.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--text-secondary)" }}>
                {columnNames[task.columnId] || task.columnId}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 shrink-0" style={{ color: "var(--text-secondary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Description</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{task.description}</p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {task.acceptanceCriteria && (
            <div>
              <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Acceptance Criteria</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{task.acceptanceCriteria}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {task.assigneeName && (
              <div>
                <span className="text-xs font-medium block" style={{ color: "var(--text-secondary)" }}>Assignee</span>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{task.assigneeName}</span>
              </div>
            )}
            {task.dueDate && (
              <div>
                <span className="text-xs font-medium block" style={{ color: "var(--text-secondary)" }}>Due Date</span>
                <span className="text-sm flex items-center gap-1" style={{ color: isOverdue ? "#ef4444" : "var(--text-primary)" }}>
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>
            )}
            {task.recurring?.enabled && (
              <div>
                <span className="text-xs font-medium block" style={{ color: "var(--text-secondary)" }}>Recurring</span>
                <span className="text-sm capitalize" style={{ color: "var(--text-primary)" }}>{task.recurring.interval}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tags</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--text-secondary)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Execution Result */}
          {task.lastResult && (
            <div>
              <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <CheckCircle2 className="w-3 h-3" /> Execution Result
              </h3>
              <div className="text-xs rounded-lg p-3 whitespace-pre-wrap max-h-60 overflow-y-auto" style={{ background: "var(--background)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {task.lastResult}
              </div>
            </div>
          )}

          {/* Activity Log */}
          {task.activities && task.activities.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Clock className="w-3 h-3" /> Activity
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {[...task.activities].reverse().slice(0, 20).map((act) => (
                  <div key={act.id} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="text-[10px] whitespace-nowrap shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {new Date(act.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>{act.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Revision — only for In Review */}
        {task.columnId === "in_review" && (
          <div>
            <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Need Revision?</h3>
            <textarea
              id="revisionInput"
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              rows={3}
              placeholder="Describe what needs to be changed..."
            />
            <button
              onClick={() => {
                const notes = (document.getElementById("revisionInput") as HTMLTextAreaElement).value;
                fetch("/api/kanban/" + task.id, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ columnId: "todo", revisionNotes: notes || "Revision requested" }),
                }).then(() => window.location.reload());
              }}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white"
            >
              Send Back to To Do
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1">
            <button onClick={() => onArchive(task.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
              <Archive className="w-3 h-3" /> Archive
            </button>
            <button onClick={() => onDelete(task.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-500/10" style={{ color: "#ef4444" }}>
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
          <button onClick={() => onEdit(task)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}
