import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getNewsById } from "@/lib/news";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const news = await getNewsById(params.id);
    if (!news) {
      return NextResponse.json({ error: "Berita tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (err) {
    logger.error("/api/berita/[id] GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
