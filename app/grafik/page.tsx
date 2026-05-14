import type { Metadata } from "next";
import Grafik from "@/components/Grafik";

export const metadata: Metadata = {
  title: "Grafik & Statistik | KataKita Kota Serang",
  description: "Pantau grafik dan tren berita mingguan dari pejabat dan unit kerja Kota Serang.",
};

export default function GrafikPage() {
  return <Grafik />;
}
