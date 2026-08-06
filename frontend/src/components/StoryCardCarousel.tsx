"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { StoryCard } from "@/types/chain";
import { ChevronUp, ChevronDown, Sparkles, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";

interface StoryCardCarouselProps {
  cards: StoryCard[];
  isGenerating?: boolean;
}

export function StoryCardCarousel({ cards, isGenerating = false }: StoryCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, cards.length]);

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full h-96 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
        <p className="text-slate-300 font-semibold">Generating your surreal memory cards...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting to Spring AI & Hugging Face pipeline</p>
      </div>
    );
  }

  const activeCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50) {
      handleNext();
    } else if (info.offset.y > 50) {
      handlePrev();
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none">
      {/* Top Slide Progress Bar */}
      <div className="w-full flex items-center justify-between gap-1 mb-4 px-2">
        {cards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "bg-purple-400 shadow-sm shadow-purple-500/50"
                : idx < currentIndex
                ? "bg-purple-900/80"
                : "bg-slate-800"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Vertical TikTok-Style Swipe Container */}
      <div
        data-testid="swipe-container"
        className="relative w-full aspect-[9/14] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-purple-950/20"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard.sequenceIndex}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col justify-between p-6 cursor-grab active:cursor-grabbing"
          >
            {/* Background Image or Loading Skeleton */}
            <div className="absolute inset-0 z-0 bg-slate-950">
              {activeCard.imageUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={activeCard.imageUrl}
                  alt={activeCard.targetItem}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-purple-950/20 to-slate-950 border border-purple-900/20 animate-pulse">
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-purple-400 mb-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Generating surreal illustration...</span>
                  <span className="text-xs text-purple-400/80 mt-1">FLUX.1-schnell model via Hugging Face</span>
                </div>
              )}
              {/* Dark Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
            </div>

            {/* Top Card Badge & Meta Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-950/90 border border-purple-800/60 text-xs font-bold text-purple-300 backdrop-blur-md">
                  Step {activeCard.sequenceIndex + 1} of {cards.length}
                </span>
                <span className="px-3.5 py-1 rounded-xl bg-indigo-950/90 border border-indigo-800/60 text-sm font-extrabold text-white backdrop-blur-md shadow-lg shadow-indigo-950/40">
                  {activeCard.targetItem}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-purple-400 backdrop-blur-md">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom Card Narrative & Visual Prompt Container */}
            <div className="relative z-10 space-y-4 pt-12">
              <div className="p-5 rounded-2xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-3">
                <p className="text-base text-slate-100 leading-relaxed font-sans font-medium">
                  {activeCard.storySegment}
                </p>

                <div className="flex items-start gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300">Prompt: </span>
                    <span className="italic text-slate-400">{activeCard.imagePrompt}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Side Swipe / Navigation Buttons for Desktop */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous card"
            className="p-3 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:bg-purple-900/80 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900/80 transition-all backdrop-blur-md shadow-lg"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            aria-label="Next card"
            className="p-3 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:bg-purple-900/80 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900/80 transition-all backdrop-blur-md shadow-lg"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Keyboard Hint */}
      <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
        <span>Swipe vertically or use Arrow Keys (↑ / ↓) to navigate</span>
        {isGenerating && (
          <span className="inline-flex items-center gap-1 text-purple-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Streaming cards...
          </span>
        )}
      </div>
    </div>
  );
}
