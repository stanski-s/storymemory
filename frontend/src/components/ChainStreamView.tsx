"use client";

import { useState } from "react";
import { useMemoryChainStream } from "@/hooks/useMemoryChainStream";
import { StoryCardCarousel } from "@/components/StoryCardCarousel";
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, ArrowLeft, LayoutGrid, Layers, Dumbbell, BookOpen, PlusCircle } from "lucide-react";
import Link from "next/link";
import { RecallGym } from "@/components/RecallGym";
import { useAuth } from "@/context/AuthContext";

interface Props {
  chainId: string;
}

export function ChainStreamView({ chainId }: Props) {
  const stream = useMemoryChainStream(chainId);
  const { authenticatedFetch } = useAuth();
  const [viewMode, setViewMode] = useState<"CAROUSEL" | "LIST" | "RECALL">("CAROUSEL");
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);

  const handleGenerateImageOnDemand = async (cardId: string) => {
    try {
      setGeneratingCardId(cardId);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await authenticatedFetch(`${baseUrl}/api/chains/${chainId}/cards/${cardId}/generate-image`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedCard = await res.json();
        if (updatedCard && updatedCard.imageUrl) {
          stream.updateCardImage(cardId, updatedCard.imageUrl);
        }
      }
    } catch (err) {
      console.error("Failed to generate image on demand:", err);
    } finally {
      setGeneratingCardId(null);
    }
  };

  // If access is denied, failed, or chain is empty due to error: show Access Restricted Screen ONLY
  if (stream.status === "FAILED" || (stream.error && stream.cards.length === 0)) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 space-y-6">
        <Link
          href="/stories"
          className="inline-flex items-center gap-2 font-mono-label text-xs font-bold text-[#1b1c15] bg-[#ffffff] px-4 py-2 rounded-xl border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#4648d4]" />
          <span>Back to My Stories</span>
        </Link>

        <div className="relative w-full">
          <div className="absolute -top-4 left-4 z-20 bg-[#ff6b6b] text-[#ffffff] border-2 border-[#1b1c15] px-4 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-1 rounded-md">
            ACCESS DENIED
          </div>

          <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-8 md:p-12 rounded-2xl space-y-6 text-center rotate-1">
            <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] border-2 border-[#ba1a1a] shadow-[4px_4px_0px_0px_#ba1a1a] flex items-center justify-center text-[#ba1a1a] mx-auto -rotate-3">
              <AlertCircle className="w-8 h-8 text-[#ba1a1a]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#1b1c15]">
                Access Restricted
              </h1>
              <p className="font-body text-sm text-[#464554] max-w-md mx-auto">
                {stream.error || "You do not have permission to view this memory chain."}
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#4648d4] text-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-base font-bold uppercase transition-all"
              >
                <BookOpen className="w-5 h-5 text-[#fdc425]" />
                <span>Go to My Stories</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#6bff8f] text-[#002109] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-base font-bold uppercase transition-all"
              >
                <PlusCircle className="w-5 h-5 text-[#00873b]" />
                <span>Create New Story</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono-label text-xs font-bold text-[#1b1c15] bg-[#ffffff] px-4 py-2 rounded-xl border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-[#4648d4]" />
          <span>Back to Generator</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#efeee3] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15]">
            <button
              onClick={() => setViewMode("CAROUSEL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-label text-xs font-bold transition-all cursor-pointer ${
                viewMode === "CAROUSEL"
                  ? "bg-[#4648d4] text-[#ffffff] shadow-[2px_2px_0px_0px_#1b1c15] border border-[#1b1c15]"
                  : "text-[#464554] hover:text-[#1b1c15]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards Story</span>
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-label text-xs font-bold transition-all cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-[#4648d4] text-[#ffffff] shadow-[2px_2px_0px_0px_#1b1c15] border border-[#1b1c15]"
                  : "text-[#464554] hover:text-[#1b1c15]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode("RECALL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-label text-xs font-bold transition-all cursor-pointer ${
                viewMode === "RECALL"
                  ? "bg-[#4648d4] text-[#ffffff] shadow-[2px_2px_0px_0px_#1b1c15] border border-[#1b1c15]"
                  : "text-[#464554] hover:text-[#1b1c15]"
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Recall Gym</span>
            </button>
          </div>

          {/* Status Badges */}
          {stream.status === "GENERATING" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-label text-xs font-bold bg-[#fdc425] text-[#6d5200] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b1c15] animate-ping" />
              Live Stream
            </span>
          )}
          {stream.status === "COMPLETED" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-label text-xs font-bold bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15]">
              <CheckCircle2 className="w-4 h-4 text-[#00873b]" />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Chain Header Panel */}
      <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 rounded-2xl space-y-4 relative">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono-label text-xs font-bold uppercase tracking-wider text-[#767586] block mb-1">
              MEMORY CHAIN
            </span>
            <h1 className="font-display text-3xl font-extrabold text-[#1b1c15] tracking-tight">
              {stream.topic || "Generating Memory Chain..."}
            </h1>
          </div>
          <div className="p-3 rounded-xl bg-[#fdc425] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] text-[#1b1c15] -rotate-3">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Comic Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between font-mono-label text-xs font-bold text-[#1b1c15]">
            <span>Progress: {stream.cards.length} of {stream.totalItems || "..."} cards</span>
            <span>{stream.progress}%</span>
          </div>
          <div className="w-full h-5 rounded-full bg-[#f5f4e8] border-2 border-[#1b1c15] overflow-hidden p-0.5 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
            <div
              className="h-full bg-[#4648d4] halftone-bg-primary rounded-full transition-all duration-500 ease-out border border-[#1b1c15]"
              style={{ width: `${stream.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Display: Story Card Carousel or List View */}
      {viewMode === "CAROUSEL" ? (
        <StoryCardCarousel
          cards={stream.cards}
          isGenerating={stream.status === "GENERATING"}
          audioError={stream.audioError}
          onGenerateImageOnDemand={handleGenerateImageOnDemand}
        />
      ) : viewMode === "RECALL" ? (
        <RecallGym chainId={chainId} cards={stream.cards} />
      ) : (
        <div className="space-y-6">
          {stream.cards.map((card) => (
            <div
              key={card.sequenceIndex}
              className="relative p-6 rounded-2xl bg-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] flex flex-col md:flex-row gap-6 items-center hover:translate-x-[2px] hover:translate-y-[2px] transition-transform"
            >
              {/* Card Image Thumbnail or Skeleton / On-demand */}
              <div className="w-full md:w-52 h-52 rounded-xl overflow-hidden bg-[#f5f4e8] border-2 border-[#1b1c15] flex-shrink-0 flex flex-col items-center justify-center relative shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.targetItem}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center font-mono-label text-xs text-[#767586] flex flex-col items-center gap-2">
                    <span className="font-bold text-[#1b1c15]">Continued scene</span>
                    <button
                      onClick={() => card.id && handleGenerateImageOnDemand(card.id)}
                      disabled={!card.id || generatingCardId === card.id}
                      className="px-3 py-1.5 rounded-lg bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn font-mono-label text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {generatingCardId === card.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ffffff]" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#fdc425]" />
                      )}
                      <span>Generate image</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] font-mono-label text-xs font-bold">
                    Step {card.sequenceIndex + 1}
                  </span>
                  <span className="px-3.5 py-1 rounded-lg bg-[#fdc425] text-[#6d5200] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] font-display text-lg font-extrabold tracking-wide">
                    {card.targetItem}
                  </span>
                </div>

                <p className="font-body text-base text-[#1b1c15] leading-relaxed font-medium">
                  {card.storySegment}
                </p>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f5f4e8] border-2 border-[#1b1c15] font-mono-label text-xs text-[#464554]">
                  <ImageIcon className="w-4 h-4 text-[#4648d4] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1b1c15]">Visual Prompt: </span>
                    <span className="italic">{card.imagePrompt}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Skeleton Card */}
          {stream.status === "GENERATING" && (
            <div className="p-6 rounded-2xl bg-[#efeee3] border-4 border-dashed border-[#1b1c15] animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-6 rounded-lg bg-[#dbdbcf] border-2 border-[#1b1c15]" />
                <div className="w-24 h-6 rounded-lg bg-[#dbdbcf] border-2 border-[#1b1c15]" />
              </div>
              <div className="h-4 bg-[#dbdbcf] rounded w-3/4" />
              <div className="h-4 bg-[#dbdbcf] rounded w-1/2" />
              <div className="flex items-center gap-2 pt-2 font-mono-label text-xs text-[#1b1c15]">
                <Loader2 className="w-4 h-4 text-[#4648d4] animate-spin" />
                <span>LLM is crafting next surreal segment...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
