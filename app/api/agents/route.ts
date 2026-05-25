import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const output = execSync("openclaw agents list --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 10000,
    });
    const agents = JSON.parse(output);
    return NextResponse.json(agents);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
