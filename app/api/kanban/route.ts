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

export async function GET() {
  const board = await readBoard();
  return NextResponse.json(board);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const board = await readBoard();

    const { title, description, acceptanceCriteria, priority, columnId, assignee, assigneeName, tags, dueDate, dependencies, recurring } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description || "",
      acceptanceCriteria: acceptanceCriteria || "",
      priority: priority || "medium",
      columnId: columnId || "backlog",
      order: (board.tasks || []).filter((t: any) => t.columnId === (columnId || "backlog")).length,
      assignee: assignee || null,
      assigneeName: assigneeName || null,
      tags: Array.isArray(tags) ? tags : [],
      dueDate: dueDate || null,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      recurring: recurring || null,
      activities: [
        {
          id: crypto.randomUUID(),
          type: "created",
          message: `Task "${title.trim()}" created`,
          timestamp: Date.now(),
        },
      ],
      status: "active",
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    board.tasks = [...(board.tasks || []), task];
    await writeBoard(board);

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create task" },
      { status: 500 }
    );
  }
}
