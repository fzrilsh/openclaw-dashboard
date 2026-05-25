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

export async function POST() {
  try {
    const board = await readBoard();
    const now = Date.now();
    const created: any[] = [];

    for (const task of board.tasks) {
      if (!task.recurring?.enabled) continue;

      // Check if enough time has passed since creation
      const elapsed = now - task.createdAt;
      let shouldCreate = false;

      switch (task.recurring.interval) {
        case "daily":
          shouldCreate = elapsed > 86400000;
          break;
        case "weekly":
          shouldCreate = elapsed > 604800000;
          break;
        case "monthly":
          shouldCreate = elapsed > 2592000000;
          break;
      }

      if (shouldCreate && task.columnId === "done") {
        const newTask = {
          ...task,
          id: crypto.randomUUID(),
          columnId: "backlog",
          order: board.tasks.filter((t: any) => t.columnId === "backlog").length,
          activities: [{
            id: crypto.randomUUID(),
            type: "created" as const,
            message: `Recurring task created from "${task.title}"`,
            timestamp: now,
          }],
          createdAt: now,
          updatedAt: now,
          archived: false,
        };
        board.tasks.push(newTask);
        created.push(newTask);
      }
    }

    if (created.length > 0) {
      await writeBoard(board);
    }

    return NextResponse.json({ created: created.length, tasks: created });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
