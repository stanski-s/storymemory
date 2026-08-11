"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  PlusCircle,
  Clock,
  Layers,
  Award,
  Play,
  LogIn,
  Brain,
  ChevronRight,
  User
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ColorfulUserName } from "@/components/ColorfulUserName";

interface StoryChain {
  id: string;
  topic: string;
  rawItems: string[];
  status: string;
  createdAt: string;
  cards?: any[];
}

interface UserStats {
  totalChains: number;
  totalRecallSessions: number;
  averageAccuracyScore: number;
  totalMemoryGaps: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function StoriesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, authenticatedFetch, logout } = useAuth();
  const [chains, setChains] = useState<StoryChain[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoadingData(false);
      return;
    }

    async function fetchData() {
      setIsLoadingData(true);
      setError(null);
      try {
        const [chainsRes, statsRes] = await Promise.all([
          authenticatedFetch(`${API_BASE}/api/chains`),
          authenticatedFetch(`${API_BASE}/api/users/me/stats`),
        ]);

        if (chainsRes.ok) {
          const chainsData = await chainsRes.json();
          setChains(chainsData);
        } else {
          setError("Failed to fetch memory chains.");
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error("Error loading stories archive:", err);
        setError("An error occurred while loading data.");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [user, authenticatedFetch]);

  return (
    <main className="min-h-screen bg-background text-on-background p-4 md:p-8 max-w-5xl mx-auto space-y-8 relative z-10">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 bg-[#efeee3] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rounded-2xl -rotate-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold text-[#1b1c15] bg-[#ffffff] hover:bg-[#f5f4e8] px-4.5 py-2.5 md:px-5 md:py-3 rounded-xl border-4 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] brutal-btn transition-all uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-[#4648d4]" />
          <span>Back to Generator</span>
        </Link>

        <div className="flex items-center gap-2 font-display text-xl md:text-2xl font-extrabold text-[#1b1c15]">
          <BookOpen className="w-6 h-6 text-[#4648d4]" />
          <span>My Stories</span>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#ffffff] px-4 py-2 rounded-xl border-3 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] -rotate-1 hover:rotate-0 transition-transform">
              <ColorfulUserName name={user.displayName} />
            </div>
            <button
              onClick={logout}
              className="text-xs font-bold font-mono-label text-[#ffffff] bg-[#ff6b6b] hover:bg-[#fa5252] border-2 border-[#1b1c15] px-3.5 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn cursor-pointer uppercase tracking-wider"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login?returnUrl=/stories"
            className="inline-flex items-center gap-2 font-display text-xs md:text-sm font-extrabold text-[#1b1c15] bg-[#6bff8f] px-3.5 py-2 rounded-xl border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn uppercase cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#002109]" />
            <span>Sign In</span>
          </Link>
        )}
      </header>

      {/* Main Content Area */}
      {!user ? (
        <div className="relative w-full max-w-3xl mx-auto my-6">
          <div className="absolute -top-4 left-4 z-20 bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] px-4 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-1 rounded-md">
            STORY ARCHIVE
          </div>

          <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-8 md:p-12 rounded-2xl space-y-6 text-center rotate-1">
            <div className="w-16 h-16 rounded-2xl bg-[#fdc425] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] flex items-center justify-center text-[#1b1c15] mx-auto -rotate-3">
              <BookOpen className="w-8 h-8 text-[#1b1c15]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-3xl font-extrabold text-[#1b1c15]">
                Sign In to View Your Stories
              </h1>
              <p className="font-body text-sm text-[#464554] max-w-md mx-auto">
                All your generated mnemonic story chains and recall progress stats are securely stored in your personal account library.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/login?returnUrl=/stories"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#4648d4] text-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-lg font-bold uppercase transition-all"
              >
                <LogIn className="w-5 h-5 text-[#fdc425]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register?returnUrl=/stories"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#6bff8f] text-[#002109] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-lg font-bold uppercase transition-all"
              >
                <Sparkles className="w-5 h-5 text-[#00873b]" />
                <span>Create Account</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top User Stats Banner */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#ffffff] border-4 border-[#1b1c15] p-4 rounded-2xl shadow-[4px_4px_0px_0px_#1b1c15] rotate-1">
                <div className="flex items-center gap-2 text-[#4648d4] font-display text-xs font-extrabold uppercase">
                  <Layers className="w-4 h-4" />
                  <span>Chains Created</span>
                </div>
                <div className="font-display text-3xl font-black text-[#1b1c15] mt-1">
                  {stats.totalChains}
                </div>
              </div>

              <div className="bg-[#ffffff] border-4 border-[#1b1c15] p-4 rounded-2xl shadow-[4px_4px_0px_0px_#1b1c15] -rotate-1">
                <div className="flex items-center gap-2 text-[#00873b] font-display text-xs font-extrabold uppercase">
                  <Brain className="w-4 h-4" />
                  <span>Recall Sessions</span>
                </div>
                <div className="font-display text-3xl font-black text-[#1b1c15] mt-1">
                  {stats.totalRecallSessions}
                </div>
              </div>

              <div className="bg-[#ffffff] border-4 border-[#1b1c15] p-4 rounded-2xl shadow-[4px_4px_0px_0px_#1b1c15] rotate-1">
                <div className="flex items-center gap-2 text-[#6d5200] font-display text-xs font-extrabold uppercase">
                  <Award className="w-4 h-4 text-[#fdc425]" />
                  <span>Avg Retention</span>
                </div>
                <div className="font-display text-3xl font-black text-[#1b1c15] mt-1">
                  {stats.averageAccuracyScore}%
                </div>
              </div>

              <div className="bg-[#ffffff] border-4 border-[#1b1c15] p-4 rounded-2xl shadow-[4px_4px_0px_0px_#1b1c15] -rotate-1">
                <div className="flex items-center gap-2 text-[#ff6b6b] font-display text-xs font-extrabold uppercase">
                  <Clock className="w-4 h-4" />
                  <span>Memory Gaps</span>
                </div>
                <div className="font-display text-3xl font-black text-[#1b1c15] mt-1">
                  {stats.totalMemoryGaps}
                </div>
              </div>
            </div>
          )}

          {/* Stories Scrollable Archive Box */}
          <div className="relative w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] px-4 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-1 rounded-md inline-block">
                SAVED CHAINS ({chains.length})
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn font-display text-xs font-bold uppercase cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#fdc425]" />
                <span>Create New Story</span>
              </Link>
            </div>

            {isLoadingData ? (
              <div className="bg-[#ffffff] border-4 border-[#1b1c15] p-12 text-center rounded-2xl shadow-[6px_6px_0px_0px_#1b1c15]">
                <Sparkles className="w-8 h-8 text-[#4648d4] animate-spin mx-auto mb-3" />
                <p className="font-display text-lg font-bold text-[#1b1c15]">Loading your stories...</p>
              </div>
            ) : chains.length === 0 ? (
              <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-8 md:p-12 rounded-2xl space-y-6 text-center rotate-1">
                <div className="w-16 h-16 rounded-2xl bg-[#6bff8f] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] flex items-center justify-center text-[#002109] mx-auto -rotate-3">
                  <Sparkles className="w-8 h-8 text-[#00873b]" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-extrabold text-[#1b1c15]">
                    No Saved Stories Yet
                  </h2>
                  <p className="font-body text-sm text-[#464554] max-w-md mx-auto">
                    You haven't generated any mnemonic story chains yet. Create your first chain to build your memory library!
                  </p>
                </div>
                <div>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#4648d4] text-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-base font-bold uppercase transition-all"
                  >
                    <PlusCircle className="w-5 h-5 text-[#fdc425]" />
                    <span>Generate First Memory Story</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* SCROLLABLE CONTAINER FOR STORIES LIST */
              <div className="max-h-[620px] overflow-y-auto pr-2 space-y-4 rounded-2xl border-4 border-[#1b1c15] p-4 bg-[#f5f4e8] shadow-[8px_8px_0px_0px_#1b1c15]">
                {chains.map((chain) => {
                  const cardCount = chain.cards?.length || chain.rawItems?.length || 0;
                  const dateStr = new Date(chain.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={chain.id}
                      onClick={() => router.push(`/chains/${chain.id}`)}
                      className="bg-[#ffffff] hover:bg-[#fffdf5] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] hover:shadow-[8px_8px_0px_0px_#1b1c15] p-5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xl font-extrabold text-[#1b1c15] group-hover:text-[#4648d4] transition-colors">
                            {chain.topic}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-label font-bold border-2 border-[#1b1c15] bg-[#fdc425] text-[#1b1c15]">
                            {chain.status}
                          </span>
                        </div>

                        {/* Raw items pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {chain.rawItems?.slice(0, 5).map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-xs font-body font-bold bg-[#efeee3] border border-[#1b1c15] text-[#1b1c15]"
                            >
                              {item}
                            </span>
                          ))}
                          {chain.rawItems && chain.rawItems.length > 5 && (
                            <span className="text-xs font-bold text-[#767586] self-center">
                              +{chain.rawItems.length - 5} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono-label text-[#767586] pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#4648d4]" />
                            {dateStr}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-[#00873b]" />
                            {cardCount} items
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] font-display text-sm font-extrabold uppercase group-hover:translate-x-0.5 transition-transform">
                          <Play className="w-4 h-4 fill-current" />
                          <span>Open</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
