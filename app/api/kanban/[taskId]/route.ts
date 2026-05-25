import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "kanban.json");

async function readBoard() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { columns: [], tasks: [] };
  }
}

async function writeBoard(data: unknown) {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const board = await readBoard();
  const task = board.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

function addActivity(task: any, type: string, message: string) {
  task.activities.push({
    id: crypto.randomUUID(),
    type,
    message,
    timestamp: Date.now(),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const board = await readBoard();
    const idx = board.tasks.findIndex((t: any) => t.id === taskId);
    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = board.tasks[idx];
    const changes: string[] = [];

    if (body.title !== undefined) { task.title = body.title; changes.push("title"); }
    if (body.description !== undefined) { task.description = body.description; changes.push("description"); }
    if (body.acceptanceCriteria !== undefined) { task.acceptanceCriteria = body.acceptanceCriteria; }
    if (body.priority !== undefined) { task.priority = body.priority; changes.push("priority"); }
    if (body.columnId !== undefined && body.columnId !== task.columnId) {
      const oldColumn = task.columnId;
      task.columnId = body.columnId;
      task.order = board.tasks.filter((t: any) => t.columnId === body.columnId).length;
      changes.push(`status to ${body.columnId}`);

      // Auto-execute when moving to "in_progress"
      if (body.columnId === "in_progress" && task.assigneeName) {
        let prompt = `## Task: ${task.title}\n\n`;
        if (task.description) prompt += `${task.description}\n\n`;
        if (task.acceptanceCriteria) prompt += `### Acceptance Criteria\n${task.acceptanceCriteria}\n\n`;
        prompt += `Priority: ${task.priority}\n`;
        if (task.dueDate) prompt += `Due: ${task.dueDate}\n`;

        try {
          const cmd = `openclaw agent --agent "${task.assigneeName}" --message ${JSON.stringify(prompt)} --json 2>/dev/null`;
          const output = execSync(cmd, { encoding: "utf-8", timeout: 120000 });
          let agentResponse = "";
          try {
            const parsed = JSON.parse(output);
            if (parsed.payloads && parsed.payloads.length > 0) {
              agentResponse = parsed.payloads.map((p: any) => p.text).filter(Boolean).join("\n");
            } else if (parsed.text) {
              agentResponse = parsed.text;
            }
          } catch {
            agentResponse = output.trim();
          }
          task.lastResult = agentResponse;
          addActivity(task, "executed", `Executed by agent "${task.assigneeName}"`);
          task.columnId = "in_review";
          changes.push("auto-executed → in_review");
        } catch (execErr) {
          addActivity(task, "execution_failed", `Execution failed: ${execErr instanceof Error ? execErr.message : "Unknown error"}`);
        }
      }
    }
    if (body.order !== undefined) { task.order = body.order; }
    if (body.assignee !== undefined) { task.assignee = body.assignee; changes.push("assignee"); }
    if (body.assigneeName !== undefined) { task.assigneeName = body.assigneeName; }
    if (body.tags !== undefined) { task.tags = body.tags; }
    if (body.dueDate !== undefined) { task.dueDate = body.dueDate; changes.push("due date"); }
    if (body.dependencies !== undefined) { task.dependencies = body.dependencies; }
    if (body.recurring !== undefined) { task.recurring = body.recurring; }
    if (body.archived !== undefined) { task.archived = body.archived; }
    if (body.status !== undefined) { task.status = body.status; }

    if (changes.length > 0) {
      addActivity(task, "updated", `Updated: ${changes.join(", ")}`);
    }

    task.updatedAt = Date.now();
    board.tasks[idx] = task;
    await writeBoard(board);

    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const board = await readBoard();
    const idx = board.tasks.findIndex((t: any) => t.id === taskId);
    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    board.tasks.splice(idx, 1);
    await writeBoard(board);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete task" },
      { status: 500 }
    );
  }
}
