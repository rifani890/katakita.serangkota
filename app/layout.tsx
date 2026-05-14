import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/utils";
import ScrollToTopButton from "@/components/ScrollButton";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "KataKita Kota Serang",
    template: "%s | KataKita Kota Serang",
  },
  description:
    "Aplikasi pemantauan berita Kota Serang dengan visualisasi statistik, tren media, dan halaman berita yang ramah.",
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
      "Aplikasi pemantauan berita Kota Serang dengan visualisasi statistik, tren media, dan halaman berita yang ramah.",
    siteName: "KataKita Kota Serang",
  },
  twitter: {
    card: "summary_large_image",
    title: "KataKita Kota Serang",
    description:
      "Aplikasi pemantauan berita Kota Serang dengan visualisasi statistik, tren media, dan halaman berita yang ramah.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      <body className={`${jakarta.className} flex flex-col min-h-screen dark:bg-dark-bg`}>
        <div className="flex-grow">{children}</div>
        <ScrollToTopButton />
      </body>
    </html>
  );
}
