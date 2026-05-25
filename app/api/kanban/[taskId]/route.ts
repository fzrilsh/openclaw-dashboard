import { NextResponse } from "next/server";
import { promises as fs } from "fs";
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
      task.columnId = body.columnId;
      task.order = board.tasks.filter((t: any) => t.columnId === body.columnId).length;
      changes.push(`status to ${body.columnId}`);
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
