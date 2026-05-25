"use client";

import type { KanbanColumn as KanbanColumnType, KanbanTask } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";

interface ColumnProps {
  column: KanbanColumnType;
  tasks: KanbanTask[];
  onDragStart: (task: KanbanTask) => void;
  onDrop: (columnId: string) => void;
  onTaskClick: (task: KanbanTask) => void;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (id: string) => void;
  onExecute?: (taskId: string) => void;
  executingId?: string | null;
}

const COLUMN_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  todo: "#3b82f6",
  in_progress: "#eab308",
  in_review: "#f97316",
  done: "#22c55e",
};

export function KanbanColumn({
  column,
  tasks,
  onDragStart,
  onDrop,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onExecute,
  executingId,
}: ColumnProps) {
  const color = COLUMN_COLORS[column.id] || "#6b7280";

  return (
    <div
      className="flex flex-col rounded-xl border flex-shrink-0 w-72"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(column.id)}
    >
      <div
        className="px-3 py-2.5 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {column.title}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--text-secondary)" }}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ minHeight: 100 }}>
        {tasks.length === 0 ? (
          <div
            className="text-xs text-center py-8 rounded-lg border-2 border-dashed"
            style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
          >
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              draggable={true}
              onDragStart={() => onDragStart(task)}
              onClick={() => onTaskClick(task)}
            >
              <TaskCard
                task={task}
                onEdit={(e) => { e.stopPropagation(); onEditTask(task); }}
                onDelete={(e) => { e.stopPropagation(); if (confirm("Delete this task?")) onDeleteTask(task.id); }}
                onExecute={task.columnId === "in_progress" ? () => onExecute?.(task.id) : undefined}
                isExecuting={executingId === task.id}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
