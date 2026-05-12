import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsById } from "@/lib/news";
import {
  buildNewsPath,
  formatDate,
  formatDateISO,
  getNewsExcerpt,
  getSiteUrl,
  stripHtml,
} from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface NewsDetailPageProps {
  params: {
    id: string;
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const news = await getNewsById(params.id);

  if (!news) {
    return {
      title: "Berita Tidak Ditemukan | KataKita Kota Serang",
    };
  }

  const description = getNewsExcerpt(news, 160);
  const canonicalUrl = `${getSiteUrl()}${buildNewsPath(news)}`;

  return {
    title: `${news.judul} | KataKita Kota Serang`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: canonicalUrl,
      title: news.judul,
      description,
      siteName: "KataKita Kota Serang",
      publishedTime: formatDateISO(news.tanggal_raw),
      modifiedTime: formatDateISO(news.tanggal_raw),
    },
    twitter: {
      card: "summary_large_image",
      title: news.judul,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const news = await getNewsById(params.id);

  if (!news) notFound();

  const canonicalPath = buildNewsPath(news);
  const canonicalUrl = `${getSiteUrl()}${canonicalPath}`;
  const description = getNewsExcerpt(news, 200);
  const articleBody = stripHtml(news.isi || "");

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.judul,
    description,
    datePublished: formatDateISO(news.tanggal_raw),
    dateModified: formatDateISO(news.tanggal_raw),
    mainEntityOfPage: canonicalUrl,
    articleBody,
    author: {
      "@type": "Organization",
      name: "KataKita Kota Serang",
    },
    publisher: {
      "@type": "Organization",
      name: "KataKita Kota Serang",
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 sm:px-8 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
            >
              <ArrowLeft size={16} /> Kembali ke Dashboard
            </Link>
          </div>

          <article className="px-5 sm:px-8 lg:px-10 py-6 sm:py-10 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600">
                <span>{news.media || "Media"}</span>
                <span>&bull;</span>
                <span>{formatDate(news.tanggal_raw)}</span>
                {news.potensi && (
                  <>
                    <span>&bull;</span>
                    <span>{news.potensi}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight text-slate-950">
                {news.judul}
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Array.isArray(news.pejabat) &&
                news.pejabat.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {name}
                  </span>
                ))}
              {news.unit && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {news.unit}
                </span>
              )}
            </div>

            <div
              className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: news.isi || "" }}
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm text-slate-600">
              URL kanonis:{" "}
              <a href={canonicalUrl} className="font-semibold text-blue-600 break-all">
                {canonicalUrl}
              </a>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
