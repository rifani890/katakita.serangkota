import BeritaCMS from "../../_components/BeritaCMS";

interface BeritaCMSPageProps {
  searchParams: {
    id?: string;
  };
}

export default function BeritaCMSPage({ searchParams }: BeritaCMSPageProps) {
  return <BeritaCMS beritaId={searchParams.id} />;
}
