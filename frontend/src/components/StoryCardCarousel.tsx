"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { StoryCard } from "@/types/chain";
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  AlertTriangle
} from "lucide-react";

interface StoryCardCarouselProps {
  cards: StoryCard[];
  isGenerating?: boolean;
  audioError?: string | null;
  onGenerateImageOnDemand?: (cardId: string) => Promise<void>;
}

export function StoryCardCarousel({ cards, isGenerating = false, audioError, onGenerateImageOnDemand }: StoryCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGeneratingCardId, setIsGeneratingCardId] = useState<string | null>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const activeCard = cards && cards.length > 0 ? (cards[currentIndex] || cards[0]) : null;

  // Auto-play / audio src change handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!activeCard?.audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      setIsPlaying(false);
      return;
    }

    // Pause existing playback before updating source to avoid AbortError on pending requests
    audio.pause();
    audio.src = activeCard.audioUrl;
    audio.currentTime = 0;

    if (isPlaying || autoAdvance) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err: Error) => {
            if (err.name === "AbortError") {
              // The media fetching process was aborted because user navigated or track changed
              return;
            }
            if (err.name === "NotAllowedError") {
              // Autoplay policy prevented playback before first user interaction
              setIsPlaying(false);
              return;
            }
            console.warn("Audio play issue:", err);
            setIsPlaying(false);
          });
      }
    }
  }, [currentIndex, activeCard?.audioUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, cards?.length, isPlaying]);

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full h-96 rounded-2xl bg-[#ffffff] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 text-[#4648d4] animate-spin mb-4" />
        <p className="font-display text-lg font-extrabold text-[#1b1c15]">Generating your surreal memory cards...</p>
        <p className="font-mono-label text-xs text-[#767586] mt-1">Connecting to Spring AI & Edge TTS</p>
      </div>
    );
  }

  // Find nearest preceding keyframe image for visual inheritance
  const inheritedImageUrl = activeCard?.imageUrl
    ? activeCard.imageUrl
    : cards.slice(0, currentIndex).reverse().find((c) => c.imageUrl)?.imageUrl ||
      cards.find((c) => c.imageUrl)?.imageUrl ||
      null;

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

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Failed to play audio:", err));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (autoAdvance && currentIndex < cards.length - 1) {
      handleNext();
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50) {
      handleNext();
    } else if (info.offset.y > 50) {
      handlePrev();
    }
  };

  const handleGenerateClick = async (cardId: string) => {
    if (!onGenerateImageOnDemand || isGeneratingCardId) return;
    try {
      setIsGeneratingCardId(cardId);
      await onGenerateImageOnDemand(cardId);
    } finally {
      setIsGeneratingCardId(null);
    }
  };

  if (!activeCard) return null;

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Top Controls: Slide Progress Bar & Audio Player Bar */}
      <div className="w-full space-y-3 mb-4 px-1">
        {/* Progress Segmented Bar */}
        <div className="w-full flex items-center justify-between gap-1.5">
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 flex-1 rounded-full border border-[#1b1c15] transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-[#fdc425] shadow-[2px_2px_0px_0px_#1b1c15]"
                  : idx < currentIndex
                  ? "bg-[#4648d4]"
                  : "bg-[#e9e9dd]"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Audio Player Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15]">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              disabled={!activeCard.audioUrl}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
              className="p-2.5 rounded-xl bg-[#4648d4] hover:bg-[#6063ee] text-[#ffffff] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              className="p-2.5 rounded-xl bg-[#f5f4e8] hover:bg-[#efeee3] text-[#1b1c15] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#ba1a1a]" /> : <Volume2 className="w-4 h-4 text-[#1b1c15]" />}
            </button>

            {/* Audio Waveform Indicator */}
            {isPlaying && (
              <div className="flex items-center gap-1 h-4 px-2">
                <span className="w-1 h-full bg-[#4648d4] animate-pulse" />
                <span className="w-1 h-2/3 bg-[#fdc425] animate-bounce" />
                <span className="w-1 h-4/5 bg-[#00873b] animate-pulse" />
              </div>
            )}

            {!activeCard.audioUrl && (
              <span className="font-mono-label text-xs font-bold text-[#6d5200] flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fdc425] border-2 border-[#1b1c15]">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#1b1c15]" />
                    <span>Generating audio...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#1b1c15] flex-shrink-0" />
                    <span>Failed to generate audio narration for the story</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Auto-Advance Toggle */}
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`px-3 py-1.5 rounded-xl border-2 border-[#1b1c15] font-mono-label text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoAdvance
                ? "bg-[#6bff8f] text-[#002109] shadow-[2px_2px_0px_0px_#1b1c15]"
                : "bg-[#f5f4e8] text-[#767586]"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoAdvance ? "text-[#00873b] animate-pulse" : "text-[#767586]"}`} />
            <span>Auto-Advance</span>
          </button>
        </div>

        {/* Global Audio Error Banner */}
        {audioError && (
          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] font-mono-label text-xs font-bold shadow-[4px_4px_0px_0px_#ba1a1a]">
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a] flex-shrink-0" />
            <span>{audioError}</span>
          </div>
        )}
      </div>

      {/* Vertical TikTok-Style Swipe Container */}
      <div
        data-testid="swipe-container"
        className="relative w-full aspect-[9/14] rounded-2xl overflow-hidden bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard.sequenceIndex}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.97 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col justify-between p-5 cursor-grab active:cursor-grabbing"
          >
            {/* Background Keyframe Image / Blur Overlay / Skeleton */}
            <div className="absolute inset-0 z-0 bg-[#f5f4e8]">
              {activeCard.imageUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  src={activeCard.imageUrl}
                  alt={activeCard.targetItem}
                  className="w-full h-full object-cover object-center"
                />
              ) : inheritedImageUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={inheritedImageUrl}
                    alt={activeCard.targetItem}
                    className="w-full h-full object-cover object-center blur-[6px] scale-105 opacity-50 grayscale-[40%]"
                  />
                  <div className="absolute inset-0 bg-[#fbfaee]/60 halftone-bg" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#f5f4e8] border-2 border-[#1b1c15] animate-pulse">
                  <div className="p-4 rounded-xl bg-[#fdc425] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] text-[#1b1c15] mb-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <span className="font-display text-base font-bold text-[#1b1c15]">Generating keyframe illustration...</span>
                  <span className="font-mono-label text-xs text-[#4648d4] mt-1">Cloudflare Workers AI (FLUX.1 Schnell)</span>
                </div>
              )}
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b1c15]/90 via-[#1b1c15]/30 to-transparent pointer-events-none" />
            </div>

            {/* Top Card Badge & Meta Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] font-mono-label text-xs font-bold">
                  Step {activeCard.sequenceIndex + 1} of {cards.length}
                </span>
                <span className="px-3.5 py-1 rounded-lg bg-[#fdc425] text-[#6d5200] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] font-display text-base font-extrabold tracking-wide">
                  {activeCard.targetItem}
                </span>
                {!activeCard.imageUrl && inheritedImageUrl && (
                  <span className="px-2.5 py-1 rounded-md bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] font-mono-label text-[10px] font-bold">
                    Continued scene
                  </span>
                )}
              </div>
              <div className="p-2 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] text-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15]">
                <Sparkles className="w-4 h-4 text-[#4648d4]" />
              </div>
            </div>

            {/* Bottom Card Narrative Box */}
            <div className="relative z-10 space-y-3 pt-12">
              <div className="p-5 rounded-2xl bg-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] space-y-3">
                <p className="font-body text-base text-[#1b1c15] leading-relaxed font-semibold">
                  {activeCard.storySegment}
                </p>

                <div className="flex items-start gap-2 pt-2 border-t-2 border-[#1b1c15]/20 font-mono-label text-xs text-[#464554]">
                  <ImageIcon className="w-4 h-4 text-[#4648d4] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1b1c15]">Prompt: </span>
                    <span className="italic">{activeCard.imagePrompt}</span>
                  </div>
                </div>

                {/* On-Demand Image Generation Button */}
                {!activeCard.imageUrl && (
                  <button
                    onClick={() => activeCard.id && handleGenerateClick(activeCard.id)}
                    disabled={!activeCard.id || isGeneratingCardId === activeCard.id}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#4648d4] hover:bg-[#6063ee] text-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn font-mono-label text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingCardId === activeCard.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#ffffff]" />
                        <span>Generating image...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#fdc425]" />
                        <span>Generate image for this card</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Side Controls for Navigation */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous card"
            className="p-3 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] text-[#1b1c15] hover:bg-[#fdc425] disabled:opacity-30 transition-all brutal-btn cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            aria-label="Next card"
            className="p-3 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] text-[#1b1c15] hover:bg-[#fdc425] disabled:opacity-30 transition-all brutal-btn cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Keyboard Hint */}
      <div className="mt-3 font-mono-label text-xs text-[#767586] flex items-center gap-3">
        <span>Space: Play/Pause | Arrows (↑ / ↓): Navigate</span>
        {isGenerating && (
          <span className="inline-flex items-center gap-1 text-[#4648d4] font-bold">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Streaming cards...
          </span>
        )}
      </div>
    </div>
  );
}


