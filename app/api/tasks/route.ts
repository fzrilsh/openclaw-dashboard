import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-static";
export const revalidate = 5;

export async function GET() {
  try {
    const output = execSync("openclaw tasks list --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 10000,
    });
    const data = JSON.parse(output);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
