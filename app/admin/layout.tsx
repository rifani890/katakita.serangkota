import type { Metadata } from "next";
import Layout from "./_components/Layout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
