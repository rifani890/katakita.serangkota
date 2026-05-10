import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  } catch (err) {
    console.error("/api/dashboard/summary GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
