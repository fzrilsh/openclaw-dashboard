"use client";

import { KanbanTask } from "@/lib/types";
import { Calendar, Edit2, Trash2 } from "lucide-react";

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "#dbeafe", text: "#1e40af", label: "Low" },
  medium: { bg: "#fef3c7", text: "#92400e", label: "Med" },
  high: { bg: "#fed7aa", text: "#9a3412", label: "High" },
  urgent: { bg: "#fecaca", text: "#991b1b", label: "Urg" },
};

export function TaskCard({ task, onEdit, onDelete, onExecute, isExecuting }: TaskCardProps) {
  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      className="rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-colors hover:border-blue-500/40"
      style={{ background: "var(--background)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4
            className="text-xs font-semibold leading-snug line-clamp-2"
            style={{ color: "var(--text-primary)" }}
          >
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit} className="p-0.5 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="p-0.5 rounded hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
          style={{ background: pc.bg, color: pc.text }}
        >
          {pc.label}
        </span>
        {onExecute && (
          <button
            onClick={(e) => { e.stopPropagation(); onExecute(); }}
            disabled={isExecuting}
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold hover:bg-blue-500/20 transition-colors"
            style={{ background: isExecuting ? "#3b82f620" : "#3b82f610", color: "#3b82f6" }}
          >
            {isExecuting ? "Running..." : "Run"}
          </button>
        )}
        {task.assigneeName && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--card)", color: "var(--text-secondary)" }}>
            {task.assigneeName}
          </span>
        )}
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-1 mt-1.5">
          <Calendar className="w-3 h-3" style={{ color: isOverdue ? "#ef4444" : "var(--text-secondary)" }} />
          <span className="text-[10px]" style={{ color: isOverdue ? "#ef4444" : "var(--text-secondary)" }}>
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      )}

      {task.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1 py-0.5 rounded"
              style={{ background: "var(--card)", color: "var(--text-secondary)" }}
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>+{task.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
