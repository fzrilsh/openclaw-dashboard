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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const board = await readBoard();
    board.columns = body.columns;
    await writeBoard(board);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
