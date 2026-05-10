import type { MetadataRoute } from "next";
import { getNewsSitemapEntries } from "@/lib/news";
import { buildNewsPath, getSiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const newsEntries = await getNewsSitemapEntries();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...newsEntries.map((news) => ({
      url: `${siteUrl}${buildNewsPath({ key: news.id, judul: news.judul })}`,
      lastModified: news.updatedAt ? new Date(news.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
