import { ChainStreamView } from "@/components/ChainStreamView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChainPage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <main className="min-h-screen bg-background text-on-background p-4 md:p-8 max-w-5xl mx-auto relative z-10">
      <ChainStreamView chainId={resolvedParams.id} />
    </main>
  );
}

