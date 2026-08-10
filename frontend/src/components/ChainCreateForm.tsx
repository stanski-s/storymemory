"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, ListOrdered, Loader2, Wand2 } from "lucide-react";

export function ChainCreateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [itemsRaw, setItemsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const items = itemsRaw
      .split(/[\n,]/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (items.length === 0) {
      setError("Please provide at least 1 item to learn.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/chains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || "Memory Chain",
          items,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.id) {
        router.push(`/chains/${data.id}`);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate story generation",
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto my-4">
      {/* Panel Cap / Badge */}
      <div className="absolute -top-5 -left-3 z-20 bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] px-4 py-1.5 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1b1c15] -rotate-2 rounded-md">
        CHAPTER 1: DISCOVERY
      </div>

      {/* Main Comic Book Panel */}
      <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-6 md:p-10 rounded-2xl relative rotate-1 transition-transform hover:rotate-0 duration-300">
        <div className="flex items-center gap-3 mb-8 pt-2">
          <div className="p-3 rounded-xl bg-[#fdc425] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] -rotate-3 text-[#1b1c15]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#1b1c15] leading-tight tracking-tight">
              Create Mnemonic Memory Chain
            </h2>
            <p className="font-body text-sm text-[#464554] mt-0.5">
              AI-powered surreal story generation connecting your target items
              into a sequential visual memory hook.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] font-body text-sm font-semibold flex items-center gap-3 shadow-[4px_4px_0px_0px_#ba1a1a]">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-display text-lg font-bold text-[#1b1c15] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4648d4]" />
              Topic / Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Solar System Planets, USA Presidents, Grocery List"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-4 font-body text-base text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.06)] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-display text-lg font-bold text-[#1b1c15] flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-[#00873b]" />
              Target Items to Memorize in Order (comma or line separated)
            </label>
            <textarea
              rows={4}
              placeholder="Mercury&#10;Venus&#10;Earth&#10;Mars"
              value={itemsRaw}
              onChange={(e) => setItemsRaw(e.target.value)}
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-4 font-mono-label text-sm text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.06)] transition-colors resize-none"
              required
            />
            <p className="font-mono-label text-xs text-[#767586] mt-1">
              Enter each item on a new line or separated by commas. The AI story
              will connect them sequentially.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full py-5 px-6 rounded-xl font-display text-xl md:text-2xl font-extrabold text-[#6d5200] bg-[#fdc425] hover:bg-[#f7be1d] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn uppercase flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all animate-wiggle"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-[#1b1c15]" />
                <span>Initiating AI Story Stream...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform text-[#1b1c15]" />
                <span>Generate Surreal Memory Chain</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
