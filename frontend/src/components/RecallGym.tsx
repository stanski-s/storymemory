"use client";

import React, { useState, useEffect } from "react";
import { StoryCard } from "@/types/chain";
import {
  RecallMode,
  RecallAnswerItem,
  RecallSessionResult,
  RecallSummaryResponse,
} from "@/types/recall";
import {
  Dumbbell,
  Eye,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface RecallGymProps {
  chainId: string;
  cards: StoryCard[];
  onComplete?: (result: RecallSessionResult) => void;
}

export function RecallGym({ chainId, cards, onComplete }: RecallGymProps) {
  const { authenticatedFetch } = useAuth();
  const [mode, setMode] = useState<RecallMode>("STEP_BY_STEP");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-card state: text, hintTier1, hintTier2
  const [answers, setAnswers] = useState<
    Record<number, { text: string; tier1: boolean; tier2: boolean }>
  >(() => {
    const initial: Record<
      number,
      { text: string; tier1: boolean; tier2: boolean }
    > = {};
    cards.forEach((card) => {
      initial[card.sequenceIndex] = { text: "", tier1: false, tier2: false };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RecallSessionResult | null>(null);
  const [summary, setSummary] = useState<RecallSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [chainId]);

  const fetchSummary = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await authenticatedFetch(`${baseUrl}/api/chains/${chainId}/recall/summary`);
      if (res.ok) {
        const data: RecallSummaryResponse = await res.json();
        setSummary(data);
      }
    } catch {
      // Summary load error ignored silently for transient states
    }
  };

  const handleTextChange = (seqIndex: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [seqIndex]: { ...prev[seqIndex], text },
    }));
  };

  const toggleTier1 = (seqIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [seqIndex]: { ...prev[seqIndex], tier1: !prev[seqIndex]?.tier1 },
    }));
  };

  const toggleTier2 = (seqIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [seqIndex]: { ...prev[seqIndex], tier2: !prev[seqIndex]?.tier2 },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const payload: RecallAnswerItem[] = cards.map((card) => {
      const state = answers[card.sequenceIndex] || {
        text: "",
        tier1: false,
        tier2: false,
      };
      return {
        sequenceIndex: card.sequenceIndex,
        userText: state.text,
        hintTier1Revealed: state.tier1,
        hintTier2Revealed: state.tier2,
      };
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await authenticatedFetch(`${baseUrl}/api/chains/${chainId}/recall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, responses: payload }),
      });

      if (!res.ok) {
        throw new Error("Failed to save recall session evaluation");
      }

      const sessionResult: RecallSessionResult = await res.json();
      setResult(sessionResult);
      if (onComplete) onComplete(sessionResult);
      await fetchSummary();
    } catch (err: any) {
      setError(err.message || "An error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetGym = () => {
    setResult(null);
    setCurrentIndex(0);
    const initial: Record<
      number,
      { text: string; tier1: boolean; tier2: boolean }
    > = {};
    cards.forEach((card) => {
      initial[card.sequenceIndex] = { text: "", tier1: false, tier2: false };
    });
    setAnswers(initial);
  };

  const renderClozeSegment = (
    card: StoryCard,
    userText: string,
    onChange: (val: string) => void
  ) => {
    const target = card.targetItem.trim();
    const segment = card.storySegment;

    // Try full match first
    const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let regex = new RegExp(`(${escapedTarget})`, "gi");
    let parts = segment.split(regex);

    // If full targetItem didn't split, try key word (e.g. "perro" from "el perro")
    if (parts.length <= 1) {
      const targetWords = target.split(/\s+/);
      const keyWord = targetWords[targetWords.length - 1];
      if (keyWord && keyWord.length >= 2) {
        const escapedKey = keyWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(`(${escapedKey})`, "gi");
        parts = segment.split(regex);
      }
    }

    if (parts.length > 1) {
      return (
        <div className="font-body text-base text-[#1b1c15] leading-relaxed font-medium bg-[#ffffff] p-4 rounded-xl border-2 border-[#1b1c15]">
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              return (
                <input
                  key={i}
                  type="text"
                  value={userText}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="[ _____ ]"
                  className="comic-input inline-block bg-[#f5f4e8] border-3 border-[#1b1c15] px-3 py-1 mx-1 font-bold text-[#4648d4] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-lg shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)] min-w-[120px] max-w-[200px]"
                />
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    }

    // Fallback if target word wasn't found in storySegment text
    return (
      <div className="space-y-2 bg-[#ffffff] p-4 rounded-xl border-2 border-[#1b1c15]">
        <p className="font-body text-sm font-semibold text-[#1b1c15] italic">
          "{segment}"
        </p>
        <input
          type="text"
          value={userText}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`[ _____ ] Fill in item #${card.sequenceIndex + 1}...`}
          className="comic-input w-full bg-[#f5f4e8] border-3 border-[#1b1c15] p-3 font-body text-base text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
        />
      </div>
    );
  };

  // Result & Analytics Screen
  if (result) {
    return (
      <div className="relative w-full max-w-4xl mx-auto my-2">
        {/* Panel Cap Badge */}
        <div className="absolute -top-4 -left-3 z-20 bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] px-4 py-1.5 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1b1c15] -rotate-2 rounded-md">
          RECALL GYM: RESULTS
        </div>

        <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 md:p-10 rounded-2xl space-y-6 text-[#1b1c15] relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#1b1c15] pb-6 pt-2">
            <div>
              <span className="font-mono-label text-xs font-bold uppercase tracking-wider text-[#767586]">
                ACTIVE RECALL SCORE
              </span>
              <h2 className="font-display text-3xl font-extrabold text-[#1b1c15] tracking-tight">
                Recall Gym Results
              </h2>
              <p className="font-body text-sm text-[#464554] mt-0.5">
                Session Mode:{" "}
                <span className="font-bold text-[#4648d4]">
                  {result.mode === "STEP_BY_STEP"
                    ? "Step-by-Step Review"
                    : result.mode === "CLOZE_STORY"
                    ? "Story Cloze Fill-in"
                    : "Full Form Review"}
                </span>
              </p>
            </div>

            <div
              className={`text-3xl md:text-4xl font-display font-extrabold px-6 py-2.5 rounded-xl border-4 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] ${
                result.accuracyScore >= 80
                  ? "bg-[#6bff8f] text-[#002109]"
                  : result.accuracyScore >= 50
                  ? "bg-[#fdc425] text-[#6d5200]"
                  : "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]"
              }`}
            >
              {result.accuracyScore}%
            </div>
          </div>

          {/* Aggregate Stats Box */}
          {summary && summary.totalSessions > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#f5f4e8] p-4 rounded-xl border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] text-center">
              <div>
                <div className="font-mono-label text-xs font-bold text-[#767586] uppercase tracking-wider">
                  Total Sessions
                </div>
                <div className="font-display text-xl font-black text-[#1b1c15] mt-1">
                  {summary.totalSessions}
                </div>
              </div>
              <div>
                <div className="font-mono-label text-xs font-bold text-[#767586] uppercase tracking-wider">
                  Latest Score
                </div>
                <div className="font-display text-xl font-black text-[#4648d4] mt-1">
                  {summary.latestAccuracyScore}%
                </div>
              </div>
              <div>
                <div className="font-mono-label text-xs font-bold text-[#767586] uppercase tracking-wider">
                  Average Score
                </div>
                <div className="font-display text-xl font-black text-[#785a00] mt-1">
                  {summary.averageAccuracyScore}%
                </div>
              </div>
              <div>
                <div className="font-mono-label text-xs font-bold text-[#767586] uppercase tracking-wider">
                  Best Score
                </div>
                <div className="font-display text-xl font-black text-[#00873b] mt-1">
                  {summary.bestAccuracyScore}%
                </div>
              </div>
            </div>
          )}

          {/* Memory Gaps Breakdown */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-extrabold text-[#1b1c15] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4648d4]" />
              <span>Memory Gaps ({result.gapCount})</span>
            </h3>

            {result.gaps.length === 0 ? (
              <div className="p-6 text-center bg-[#6bff8f] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] rounded-xl text-[#002109] font-bold text-base">
                🎉 Perfect score! All target items remembered without any hints!
              </div>
            ) : (
              <div className="space-y-4">
                {result.gaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="p-5 rounded-xl border-3 border-[#1b1c15] bg-[#f5f4e8] shadow-[4px_4px_0px_0px_#1b1c15] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] font-mono-label text-xs font-bold">
                          #{gap.sequenceIndex + 1}
                        </span>
                        <span className="font-display font-black text-xl text-[#1b1c15]">
                          {gap.targetItem}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono-label font-bold px-3 py-1 rounded-full border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] ${
                          gap.hintTier1Revealed || gap.hintTier2Revealed
                            ? "bg-[#fdc425] text-[#6d5200]"
                            : "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]"
                        }`}
                      >
                        {gap.hintTier1Revealed || gap.hintTier2Revealed
                          ? "Hint Used"
                          : "Incorrect / Missing"}
                      </span>
                    </div>

                    <div className="font-mono-label text-xs text-[#464554] flex items-center gap-2">
                      <span>Submitted text:</span>
                      <span className="font-bold text-[#1b1c15] bg-[#ffffff] px-2.5 py-1 rounded-md border border-[#1b1c15]">
                        {gap.userSubmittedText || "(blank)"}
                      </span>
                    </div>

                    {/* Story Card Hint Scaffold */}
                    <div className="p-4 bg-[#ffffff] rounded-xl border-2 border-[#1b1c15] flex flex-col md:flex-row gap-4 items-center shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)]">
                      {gap.storyCard.imageUrl && (
                        <img
                          src={gap.storyCard.imageUrl}
                          alt={gap.targetItem}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-[#1b1c15] shrink-0"
                        />
                      )}
                      <div className="space-y-1.5 flex-1">
                        <p className="font-body text-sm text-[#1b1c15] font-semibold italic">
                          "{gap.storyCard.storySegment}"
                        </p>
                        {gap.storyCard.audioUrl && (
                          <audio
                            controls
                            src={gap.storyCard.audioUrl}
                            className="h-8 w-full mt-1"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={resetGym}
            className="w-full py-4 px-6 rounded-xl font-display text-xl font-extrabold text-[#ffffff] bg-[#4648d4] hover:bg-[#3b3dbf] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-5 h-5 text-[#ffffff]" />
            <span>Try Recall Gym Again</span>
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const currentAnswer = answers[currentCard?.sequenceIndex] || {
    text: "",
    tier1: false,
    tier2: false,
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2">
      {/* Panel Cap Badge */}
      <div className="absolute -top-4 -left-3 z-20 bg-[#fdc425] text-[#6d5200] border-2 border-[#1b1c15] px-4 py-1.5 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1b1c15] -rotate-2 rounded-md flex items-center gap-1.5">
        <Dumbbell className="w-3.5 h-3.5" />
        CHAPTER 2: RECALL GYM
      </div>

      <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 md:p-10 rounded-2xl space-y-6 text-[#1b1c15] relative">
        {/* Top Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1b1c15] pb-6 pt-2">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#1b1c15] tracking-tight">
              Active Recall Review Gym
            </h2>
            <p className="font-body text-sm text-[#464554] mt-0.5">
              Test your active memory by typing target items in sequence.
            </p>
          </div>

          <div className="flex flex-wrap items-center p-1 rounded-xl bg-[#efeee3] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] shrink-0 gap-0.5">
            <button
              type="button"
              onClick={() => setMode("STEP_BY_STEP")}
              className={`px-3 py-1.5 rounded-lg font-mono-label text-xs font-bold transition-all cursor-pointer ${
                mode === "STEP_BY_STEP"
                  ? "bg-[#4648d4] text-[#ffffff] shadow-[2px_2px_0px_0px_#1b1c15] border border-[#1b1c15]"
                  : "text-[#464554] hover:text-[#1b1c15]"
              }`}
            >
              Step-by-Step
            </button>
            <button
              type="button"
              onClick={() => setMode("FULL_FORM")}
              className={`px-3 py-1.5 rounded-lg font-mono-label text-xs font-bold transition-all cursor-pointer ${
                mode === "FULL_FORM"
                  ? "bg-[#4648d4] text-[#ffffff] shadow-[2px_2px_0px_0px_#1b1c15] border border-[#1b1c15]"
                  : "text-[#464554] hover:text-[#1b1c15]"
              }`}
            >
              Full List Form
            </button>
            <button
              type="button"
              onClick={() => setMode("CLOZE_STORY")}
              className={`px-3 py-1.5 rounded-lg font-mono-label text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === "CLOZE_STORY"
                  ? "bg-[#4648d4] text-[#ffffff] shadow-[2px_2px_0px_0px_#1b1c15] border border-[#1b1c15]"
                  : "text-[#464554] hover:text-[#1b1c15]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Story Cloze</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] font-body text-sm font-semibold flex items-center gap-3 shadow-[4px_4px_0px_0px_#ba1a1a]">
            <AlertCircle className="w-5 h-5 text-[#ba1a1a] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: STEP-BY-STEP */}
        {mode === "STEP_BY_STEP" && currentCard && (
          <div className="space-y-6">
            {/* Comic Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono-label text-xs font-bold text-[#1b1c15]">
                <span>
                  Step {currentIndex + 1} of {cards.length}
                </span>
                <span>
                  {Math.round(((currentIndex + 1) / cards.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-5 rounded-full bg-[#f5f4e8] border-2 border-[#1b1c15] overflow-hidden p-0.5 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                <div
                  className="h-full bg-[#4648d4] halftone-bg-primary rounded-full transition-all duration-300 border border-[#1b1c15]"
                  style={{
                    width: `${((currentIndex + 1) / cards.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-6 bg-[#f5f4e8] border-3 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rounded-xl space-y-5">
              <label className="block font-display text-lg font-bold text-[#1b1c15]">
                Target Item #{currentIndex + 1}:
              </label>

              <input
                type="text"
                value={currentAnswer.text}
                onChange={(e) =>
                  handleTextChange(currentCard.sequenceIndex, e.target.value)
                }
                placeholder="Type remembered word..."
                className="comic-input w-full bg-[#ffffff] border-4 border-[#1b1c15] p-4 font-body text-base text-[#1b1c15] placeholder-[#767586] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.06)]"
              />

              {/* Progressive Hint Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => toggleTier1(currentCard.sequenceIndex)}
                  className={`px-4 py-2 rounded-xl font-mono-label text-xs font-bold border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all flex items-center gap-2 cursor-pointer ${
                    currentAnswer.tier1
                      ? "bg-[#fdc425] text-[#6d5200]"
                      : "bg-[#ffffff] text-[#1b1c15] hover:bg-[#efeee3]"
                  }`}
                >
                  <Eye className="w-4 h-4 text-[#1b1c15]" />
                  <span>Visual Hint</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleTier2(currentCard.sequenceIndex)}
                  className={`px-4 py-2 rounded-xl font-mono-label text-xs font-bold border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all flex items-center gap-2 cursor-pointer ${
                    currentAnswer.tier2
                      ? "bg-[#6bff8f] text-[#002109]"
                      : "bg-[#ffffff] text-[#1b1c15] hover:bg-[#efeee3]"
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-[#1b1c15]" />
                  <span>Audio & Text Hint</span>
                </button>
              </div>

              {/* Tier 1 Hint Reveal (Illustration) */}
              {currentAnswer.tier1 && currentCard.imageUrl && (
                <div className="p-4 bg-[#ffffff] border-2 border-[#1b1c15] rounded-xl shadow-[4px_4px_0px_0px_#1b1c15] flex justify-center">
                  <img
                    src={currentCard.imageUrl}
                    alt={`Visual hint for step ${currentIndex + 1}`}
                    className="max-h-56 object-contain rounded-lg border-2 border-[#1b1c15]"
                  />
                </div>
              )}

              {/* Tier 2 Hint Reveal (Audio & Story text) */}
              {currentAnswer.tier2 && (
                <div className="p-4 bg-[#ffffff] border-2 border-[#1b1c15] rounded-xl shadow-[4px_4px_0px_0px_#1b1c15] space-y-3">
                  <p className="font-body text-sm font-semibold text-[#1b1c15] italic">
                    "{currentCard.storySegment}"
                  </p>
                  {currentCard.audioUrl && (
                    <audio
                      controls
                      src={currentCard.audioUrl}
                      className="w-full h-8"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-2 font-mono-label text-xs font-bold text-[#1b1c15] bg-[#ffffff] px-4 py-2.5 rounded-xl border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#4648d4]" />
                <span>Previous</span>
              </button>

              {currentIndex < cards.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => Math.min(cards.length - 1, i + 1))
                  }
                  className="inline-flex items-center gap-2 font-mono-label text-xs font-bold text-[#ffffff] bg-[#4648d4] hover:bg-[#3b3dbf] px-5 py-2.5 rounded-xl border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all cursor-pointer"
                >
                  <span>Next Word</span>
                  <ArrowRight className="w-4 h-4 text-[#ffffff]" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 font-display text-base font-extrabold text-[#6d5200] bg-[#fdc425] hover:bg-[#f7be1d] px-6 py-2.5 rounded-xl border-3 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] brutal-btn uppercase transition-all cursor-pointer"
                >
                  <Check className="w-5 h-5 text-[#1b1c15]" />
                  <span>{isSubmitting ? "Submitting..." : "Finish & Check Results"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: FULL LIST FORM */}
        {mode === "FULL_FORM" && (
          <div className="space-y-6">
            <div className="space-y-4">
              {cards.map((card, idx) => {
                const state = answers[card.sequenceIndex] || {
                  text: "",
                  tier1: false,
                  tier2: false,
                };

                return (
                  <div
                    key={card.sequenceIndex}
                    className="p-5 bg-[#f5f4e8] border-3 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-label text-xs font-bold text-[#4648d4] uppercase">
                        Item #{idx + 1}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTier1(card.sequenceIndex)}
                          className={`text-xs px-3 py-1 rounded-lg font-mono-label font-bold border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn transition-all cursor-pointer ${
                            state.tier1
                              ? "bg-[#fdc425] text-[#6d5200]"
                              : "bg-[#ffffff] text-[#1b1c15]"
                          }`}
                        >
                          👁️ Hint 1 (Visual)
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTier2(card.sequenceIndex)}
                          className={`text-xs px-3 py-1 rounded-lg font-mono-label font-bold border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn transition-all cursor-pointer ${
                            state.tier2
                              ? "bg-[#6bff8f] text-[#002109]"
                              : "bg-[#ffffff] text-[#1b1c15]"
                          }`}
                        >
                          🔊 Hint 2 (Story & Audio)
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={state.text}
                      onChange={(e) =>
                        handleTextChange(card.sequenceIndex, e.target.value)
                      }
                      placeholder={`Type remembered word #${idx + 1}...`}
                      className="comic-input w-full bg-[#ffffff] border-3 border-[#1b1c15] p-3 font-body text-base text-[#1b1c15] placeholder-[#767586] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
                    />

                    {state.tier1 && card.imageUrl && (
                      <div className="p-3 bg-[#ffffff] border-2 border-[#1b1c15] rounded-xl flex justify-center">
                        <img
                          src={card.imageUrl}
                          alt={`Hint #${idx + 1}`}
                          className="max-h-40 object-contain rounded border-2 border-[#1b1c15]"
                        />
                      </div>
                    )}

                    {state.tier2 && (
                      <div className="p-3 bg-[#ffffff] border-2 border-[#1b1c15] rounded-xl space-y-2">
                        <p className="font-body text-xs font-semibold italic text-[#1b1c15]">
                          "{card.storySegment}"
                        </p>
                        {card.audioUrl && (
                          <audio
                            controls
                            src={card.audioUrl}
                            className="w-full h-8"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-4 px-6 rounded-xl font-display text-xl font-extrabold text-[#6d5200] bg-[#fdc425] hover:bg-[#f7be1d] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-6 h-6 text-[#1b1c15]" />
              <span>{isSubmitting ? "Submitting..." : "Submit & Check Results"}</span>
            </button>
          </div>
        )}

        {/* MODE 3: CLOZE STORY */}
        {mode === "CLOZE_STORY" && (
          <div className="space-y-6">
            <div className="p-4 bg-[#f5f4e8] border-2 border-[#1b1c15] rounded-xl font-mono-label text-xs text-[#464554]">
              💡 <span className="font-bold text-[#1b1c15]">Story Cloze Mode:</span> Read the story narrative and fill in the missing target keywords in the blanks.
            </div>

            <div className="space-y-6">
              {cards.map((card, idx) => {
                const state = answers[card.sequenceIndex] || {
                  text: "",
                  tier1: false,
                  tier2: false,
                };

                return (
                  <div
                    key={card.sequenceIndex}
                    className="p-6 bg-[#f5f4e8] border-3 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] rounded-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-label text-xs font-bold px-3 py-1 bg-[#4648d4] text-[#ffffff] rounded-lg border border-[#1b1c15]">
                        Segment #{idx + 1}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTier1(card.sequenceIndex)}
                          className={`text-xs px-3 py-1 rounded-lg font-mono-label font-bold border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn transition-all cursor-pointer ${
                            state.tier1
                              ? "bg-[#fdc425] text-[#6d5200]"
                              : "bg-[#ffffff] text-[#1b1c15]"
                          }`}
                        >
                          👁️ Hint 1 (Visual)
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTier2(card.sequenceIndex)}
                          className={`text-xs px-3 py-1 rounded-lg font-mono-label font-bold border-2 border-[#1b1c15] shadow-[2px_2px_0px_0px_#1b1c15] brutal-btn transition-all cursor-pointer ${
                            state.tier2
                              ? "bg-[#6bff8f] text-[#002109]"
                              : "bg-[#ffffff] text-[#1b1c15]"
                          }`}
                        >
                          🔊 Hint 2 (Audio)
                        </button>
                      </div>
                    </div>

                    {/* Cloze Text Segment with Inline Input */}
                    {renderClozeSegment(card, state.text, (val) =>
                      handleTextChange(card.sequenceIndex, val)
                    )}

                    {state.tier1 && card.imageUrl && (
                      <div className="p-3 bg-[#ffffff] border-2 border-[#1b1c15] rounded-xl flex justify-center shadow-[3px_3px_0px_0px_#1b1c15]">
                        <img
                          src={card.imageUrl}
                          alt={`Hint #${idx + 1}`}
                          className="max-h-48 object-contain rounded border-2 border-[#1b1c15]"
                        />
                      </div>
                    )}

                    {state.tier2 && (
                      <div className="p-3 bg-[#ffffff] border-2 border-[#1b1c15] rounded-xl space-y-2 shadow-[3px_3px_0px_0px_#1b1c15]">
                        {card.audioUrl && (
                          <audio
                            controls
                            src={card.audioUrl}
                            className="w-full h-8"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-4 px-6 rounded-xl font-display text-xl font-extrabold text-[#6d5200] bg-[#fdc425] hover:bg-[#f7be1d] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-6 h-6 text-[#1b1c15]" />
              <span>{isSubmitting ? "Submitting..." : "Submit & Check Results"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
