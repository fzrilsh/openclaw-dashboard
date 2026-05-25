"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  HelpCircle,
  ListTodo,
} from "lucide-react";
import type { TasksListResult, TaskInfo } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  succeeded: "#22c55e",
  failed: "#ef4444",
  running: "#3b82f6",
  queued: "#eab308",
  cancelled: "#6b7280",
  timed_out: "#f97316",
  lost: "#ef4444",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  succeeded: <CheckCircle2 className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  running: <Play className="w-4 h-4" />,
  queued: <Clock className="w-4 h-4" />,
  cancelled: <Pause className="w-4 h-4" />,
};

const RUNTIME_COLORS: Record<string, string> = {
  subagent: "#8b5cf6",
  cli: "#0ea5e9",
  acp: "#f97316",
  cron: "#10b981",
};

export default function TasksPage() {
  const [data, setData] = useState<TasksListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimeFilter, setRuntimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filteredTasks = (data?.tasks || []).filter((t) => {
    if (runtimeFilter !== "all" && t.runtime !== runtimeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const statusCounts = (data?.tasks || []).reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Tasks
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {data?.count ?? 0} total tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={runtimeFilter}
            onChange={(e) => setRuntimeFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <option value="all">All Runtimes</option>
            <option value="subagent">Subagent</option>
            <option value="cli">CLI</option>
            <option value="acp">ACP</option>
            <option value="cron">Cron</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <option value="all">All Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="cancelled">Cancelled</option>
            <option value="timed_out">Timed Out</option>
            <option value="lost">Lost</option>
          </select>
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: (STATUS_COLORS[status] || "#6b7280") + "15",
              color: STATUS_COLORS[status] || "#6b7280",
            }}
          >
            {STATUS_ICONS[status] || <HelpCircle className="w-3 h-3" />}
            {status}: {count}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-secondary)" }}>
          <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No tasks found</p>
          <p className="text-sm mt-1">No background tasks match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: TaskInfo }) {
  const statusColor = STATUS_COLORS[task.status] || "#6b7280";
  const runtimeColor = RUNTIME_COLORS[task.runtime] || "#6b7280";

  return (
    <div
      className="rounded-xl border p-4 transition-colors hover:border-blue-500/30"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {task.label || task.taskId.slice(0, 8) + "..."}
            </h3>
            <p className="text-xs truncate mt-0.5 font-mono" style={{ color: "var(--text-secondary)" }}>
              {task.taskId} · {task.agentId || "?"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: runtimeColor + "15", color: runtimeColor }}
          >
            {task.runtime}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
            style={{ background: statusColor + "15", color: statusColor }}
          >
            {task.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span>Created: {formatTime(task.createdAt)}</span>
        {task.startedAt && <span>Started: {formatTime(task.startedAt)}</span>}
        {task.endedAt && <span>Ended: {formatTime(task.endedAt)}</span>}
      </div>

      {task.terminalSummary && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {task.terminalSummary}
        </p>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return diffMin + "m ago";
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return diffHour + "h ago";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
