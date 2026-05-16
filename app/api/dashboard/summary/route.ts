import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getDashboardSummary } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    const response = NextResponse.json(summary);
    // Cache for 30 seconds at edge, serve stale while revalidating for another 59s
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=59");
    return response;
  } catch (err) {
    logger.error("/api/dashboard/summary GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
