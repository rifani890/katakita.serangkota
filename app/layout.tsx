import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "KataKita Kota Serang",
    template: "%s | KataKita Kota Serang",
  },
  description:
    "Dashboard pemantauan berita Kota Serang dengan visualisasi statistik, tren media, dan halaman berita yang ramah SEO.",
  keywords: [
    "KataKita",
    "Kota Serang",
    "berita Kota Serang",
    "dashboard media",
    "monitoring berita",
    "SEO berita",
  ],
  applicationName: "KataKita Kota Serang",
  authors: [{ name: "KataKita Kota Serang" }],
  creator: "KataKita Kota Serang",
  publisher: "KataKita Kota Serang",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    title: "KataKita Kota Serang",
    description:
      "Dashboard pemantauan berita Kota Serang dengan visualisasi statistik, tren media, dan halaman berita yang ramah SEO.",
    siteName: "KataKita Kota Serang",
  },
  twitter: {
    card: "summary_large_image",
    title: "KataKita Kota Serang",
    description:
      "Dashboard pemantauan berita Kota Serang dengan visualisasi statistik, tren media, dan halaman berita yang ramah SEO.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen dark:bg-dark-bg">
        <div className="flex-grow">
          {children}
        </div>
        <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-800 bg-transparent transition-colors">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em]">
            Diskominfo &copy; 2026 KataKita Kota Serang
          </p>
        </footer>
      </body>
    </html>
  );
}
