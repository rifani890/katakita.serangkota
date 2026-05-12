import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    const response = NextResponse.json(summary);
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } catch (err) {
    console.error("/api/dashboard/summary GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
