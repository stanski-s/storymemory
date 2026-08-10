"use client";

import { useState } from "react";
import { useMemoryChainStream } from "@/hooks/useMemoryChainStream";
import { StoryCardCarousel } from "@/components/StoryCardCarousel";
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, ArrowLeft, LayoutGrid, Layers } from "lucide-react";
import Link from "next/link";

interface Props {
  chainId: string;
}

export function ChainStreamView({ chainId }: Props) {
  const stream = useMemoryChainStream(chainId);
  const [viewMode, setViewMode] = useState<"CAROUSEL" | "LIST">("CAROUSEL");
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);

  const handleGenerateImageOnDemand = async (cardId: string) => {
    try {
      setGeneratingCardId(cardId);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/chains/${chainId}/cards/${cardId}/generate-image`, {
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Generator</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("CAROUSEL")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
                viewMode === "CAROUSEL" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards Story</span>
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
                viewMode === "LIST" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          {stream.status === "GENERATING" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Live Stream
            </span>
          )}
          {stream.status === "COMPLETED" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
          {stream.status === "FAILED" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-300">
              <AlertCircle className="w-3.5 h-3.5" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Main Chain Card Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {stream.topic || "Generating Memory Chain..."}
            </h1>
          </div>
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progress: {stream.cards.length} of {stream.totalItems || "..."} cards</span>
            <span>{stream.progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 transition-all duration-500 ease-out"
              style={{ width: `${stream.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {stream.error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold">Generation Failed</p>
            <p className="text-xs text-red-300">{stream.error}</p>
          </div>
        </div>
      )}

      {/* Primary Display: TikTok Swipeable Carousel or List View */}
      {viewMode === "CAROUSEL" ? (
        <StoryCardCarousel
          cards={stream.cards}
          isGenerating={stream.status === "GENERATING"}
          audioError={stream.audioError}
          onGenerateImageOnDemand={handleGenerateImageOnDemand}
        />
      ) : (

        <div className="space-y-6">
          {stream.cards.map((card) => (
            <div
              key={card.sequenceIndex}
              className="group relative p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/10 flex flex-col md:flex-row gap-6 items-center"
            >
              {/* Card Image Thumbnail or Skeleton / On-demand */}
              <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex flex-col items-center justify-center relative">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.targetItem}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <span className="text-slate-500">Continued scene</span>
                    <button
                      onClick={() => card.id && handleGenerateImageOnDemand(card.id)}
                      disabled={!card.id || generatingCardId === card.id}
                      className="px-3 py-1.5 rounded-xl bg-purple-900/80 border border-purple-700/60 text-purple-200 hover:bg-purple-800 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {generatingCardId === card.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      )}
                      <span>Generate image</span>
                    </button>
                  </div>

                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-800/50 text-xs font-semibold text-purple-300">
                    Step {card.sequenceIndex + 1}
                  </span>
                  <span className="px-3.5 py-1 rounded-xl bg-indigo-950/80 border border-indigo-800/50 text-sm font-bold text-indigo-200 tracking-wide">
                    {card.targetItem}
                  </span>
                </div>

                <p className="text-base text-slate-100 leading-relaxed font-sans font-medium">
                  {card.storySegment}
                </p>

                <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-400">
                  <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300">Visual Prompt: </span>
                    <span className="italic">{card.imagePrompt}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Skeleton Card */}
          {stream.status === "GENERATING" && (
            <div className="p-6 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800/80 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-6 rounded-xl bg-slate-800" />
                <div className="w-24 h-6 rounded-xl bg-slate-800" />
              </div>
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="flex items-center gap-2 pt-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs text-slate-400">LLM is crafting next surreal segment...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

