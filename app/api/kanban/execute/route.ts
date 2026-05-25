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

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const board = await readBoard();
    const idx = board.tasks.findIndex((t: any) => t.id === taskId);
    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = board.tasks[idx];

    if (!task.assigneeName || task.assigneeName === "") {
      return NextResponse.json({ error: "Task has no assignee" }, { status: 400 });
    }

    // Build the task prompt for the agent
    let prompt = `## Task: ${task.title}\n\n`;
    if (task.description) prompt += `${task.description}\n\n`;
    if (task.acceptanceCriteria) prompt += `### Acceptance Criteria\n${task.acceptanceCriteria}\n\n`;
    prompt += `Priority: ${task.priority}\n`;
    if (task.dueDate) prompt += `Due: ${task.dueDate}\n`;

    // Execute via openclaw agent
    let result;
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
      result = { ok: true, output: agentResponse.substring(0, 500) };
    } catch (execErr) {
      result = {
        ok: false,
        error: execErr instanceof Error ? execErr.message : "Execution failed",
      };
    }

    // Update task with execution result
    task.activities.push({
      id: crypto.randomUUID(),
      type: result.ok ? "executed" : "execution_failed",
      message: result.ok
        ? `Executing via agent "${task.assigneeName}"...`
        : `Execution failed: ${result.error}`,
      timestamp: Date.now(),
    });

    task.updatedAt = Date.now();

    // Auto-move to "in_review" on success
    if (result.ok) {
      task.columnId = "in_review";
      task.order = board.tasks.filter((t: any) => t.columnId === "in_review").length;
    }

    board.tasks[idx] = task;
    await writeBoard(board);

    return NextResponse.json({ task, execution: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute task" },
      { status: 500 }
    );
  }
}
