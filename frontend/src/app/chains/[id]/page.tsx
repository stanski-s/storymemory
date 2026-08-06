import { ChainStreamView } from "@/components/ChainStreamView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChainPage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <ChainStreamView chainId={resolvedParams.id} />
    </main>
  );
}
