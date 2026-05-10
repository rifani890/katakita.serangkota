import AdminBeritaCMSClient from "../../_components/AdminBeritaCMSClient";

interface BeritaCMSPageProps {
  searchParams: {
    id?: string;
  };
}

export default function BeritaCMSPage({ searchParams }: BeritaCMSPageProps) {
  return <AdminBeritaCMSClient beritaId={searchParams.id} />;
}
