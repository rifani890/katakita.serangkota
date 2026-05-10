import type { Metadata } from "next";
import DashboardClient from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard Monitoring Berita Kota Serang",
  description:
    "Pantau statistik berita, tren media cetak, sentimen pemberitaan, dan halaman berita Kota Serang yang siap diindeks Google.",
};

export default function HomePage() {
  return <DashboardClient />;
}
