"use client";

import { useEffect, useState, useRef } from "react";
import { StoryCard } from "@/types/chain";
import { useAuth } from "@/context/AuthContext";

export interface StreamState {
  status: "IDLE" | "CONNECTING" | "GENERATING" | "COMPLETED" | "FAILED";
  topic: string;
  totalItems: number;
  cards: StoryCard[];
  progress: number;
  error: string | null;
  audioError: string | null;
}

export function useMemoryChainStream(chainId: string | null) {
  const { getSseTicket, authenticatedFetch } = useAuth();
  const [state, setState] = useState<StreamState>({
    status: "IDLE",
    topic: "",
    totalItems: 0,
    cards: [],
    progress: 0,
    error: null,
    audioError: null,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!chainId) return;

    let eventSource: EventSource | null = null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // 1. Initial authenticated fetch to immediately load existing chain data if already persisted
    async function loadInitialChainData(): Promise<boolean> {
      try {
        const res = await authenticatedFetch(`${baseUrl}/api/chains/${chainId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const initialCards: StoryCard[] = (data.cards || []).map((c: any) => ({
              id: c.id,
              sequenceIndex: c.sequenceIndex,
              targetItem: c.targetItem,
              storySegment: c.storySegment,
              imagePrompt: c.imagePrompt,
              imageUrl: c.imageUrl || null,
              audioUrl: c.audioUrl || null,
            }));

            const isCompleted = data.status === "COMPLETED";
            const isFailed = data.status === "FAILED";

            setState((prev) => ({
              ...prev,
              topic: data.topic || prev.topic,
              totalItems: data.rawItems ? data.rawItems.length : prev.totalItems,
              cards: initialCards.length > 0 ? initialCards : prev.cards,
              status: isCompleted ? "COMPLETED" : isFailed ? "FAILED" : initialCards.length > 0 ? "GENERATING" : "CONNECTING",
              progress: isCompleted ? 100 : initialCards.length > 0 ? Math.min(100, Math.round((initialCards.length / (data.rawItems?.length || 1)) * 100)) : prev.progress,
            }));
            return true;
          }
        } else if (res.status === 403) {
          setState({
            status: "FAILED",
            topic: "",
            totalItems: 0,
            cards: [],
            progress: 0,
            error: "You do not have permission to view this memory chain.",
            audioError: null,
          });
          return false;
        } else if (res.status === 404) {
          setState({
            status: "FAILED",
            topic: "",
            totalItems: 0,
            cards: [],
            progress: 0,
            error: "Memory chain not found.",
            audioError: null,
          });
          return false;
        }
      } catch (err) {
        console.warn("Initial chain fetch notice:", err);
      }
      return true;
    }

    // 2. Initialize SSE stream with single-use ticket
    async function initStream() {
      const isAllowed = await loadInitialChainData();
      if (!isAllowed) {
        return; // Access denied or chain not found: stop stream initialization
      }

      let sseUrl = `${baseUrl}/api/chains/${chainId}/stream`;

      try {
        const ticket = await getSseTicket();
        if (ticket) {
          sseUrl += `?ticket=${encodeURIComponent(ticket)}`;
        }
      } catch (e) {
        console.warn("Could not get SSE ticket, attempting connection without ticket:", e);
      }

      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("CHAIN_CREATED", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setState((prev) => ({
            ...prev,
            status: prev.status === "COMPLETED" ? "COMPLETED" : "GENERATING",
            topic: data.topic || prev.topic,
            totalItems: data.totalItems || prev.totalItems,
          }));
        } catch (err) {
          console.error("Error parsing CHAIN_CREATED event", err);
        }
      });

      eventSource.addEventListener("CARD_GENERATED", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const newCard: StoryCard = {
            id: data.cardId,
            sequenceIndex: data.sequenceIndex,
            targetItem: data.targetItem,
            storySegment: data.storySegment,
            imagePrompt: data.imagePrompt,
            imageUrl: data.imageUrl || null,
            audioUrl: data.audioUrl || null,
          };

          setState((prev) => {
            const existing = prev.cards.find((c) => c.sequenceIndex === newCard.sequenceIndex);
            const updatedCard = existing
              ? { ...existing, ...newCard, imageUrl: newCard.imageUrl || existing.imageUrl, audioUrl: newCard.audioUrl || existing.audioUrl }
              : newCard;
            const cards = existing
              ? prev.cards.map((c) => (c.sequenceIndex === newCard.sequenceIndex ? updatedCard : c))
              : [...prev.cards, updatedCard].sort((a, b) => a.sequenceIndex - b.sequenceIndex);

            const progress = prev.totalItems > 0 ? Math.min(100, Math.round((cards.length / prev.totalItems) * 100)) : 50;

            return {
              ...prev,
              cards,
              progress: prev.status === "COMPLETED" ? 100 : progress,
              status: prev.status === "COMPLETED" ? "COMPLETED" : "GENERATING",
            };
          });
        } catch (err) {
          console.error("Error parsing CARD_GENERATED event", err);
        }
      });

      eventSource.addEventListener("CARD_IMAGE_GENERATED", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const sequenceIndex = data.sequenceIndex;
          const imageUrl = data.imageUrl;

          setState((prev) => {
            const cards = prev.cards.map((c) => {
              if (c.sequenceIndex === sequenceIndex) {
                return { ...c, imageUrl: imageUrl || c.imageUrl };
              }
              return c;
            });
            return {
              ...prev,
              cards,
            };
          });
        } catch (err) {
          console.error("Error parsing CARD_IMAGE_GENERATED event", err);
        }
      });

      eventSource.addEventListener("CARD_AUDIO_GENERATED", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const sequenceIndex = data.sequenceIndex;
          const audioUrl = data.audioUrl;

          setState((prev) => {
            const cards = prev.cards.map((c) => {
              if (c.sequenceIndex === sequenceIndex) {
                return { ...c, audioUrl: audioUrl || c.audioUrl };
              }
              return c;
            });
            return {
              ...prev,
              cards,
            };
          });
        } catch (err) {
          console.error("Error parsing CARD_AUDIO_GENERATED event", err);
        }
      });

      eventSource.addEventListener("CARD_AUDIO_FAILED", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setState((prev) => ({
            ...prev,
            audioError: data.message || "Failed to generate audio narration for the story",
          }));
        } catch (err) {
          console.error("Error parsing CARD_AUDIO_FAILED event", err);
          setState((prev) => ({
            ...prev,
            audioError: "Failed to generate audio narration for the story",
          }));
        }
      });

      eventSource.addEventListener("PING", () => {
        // Heartbeat ping
      });

      eventSource.addEventListener("CHAIN_COMPLETED", () => {
        setState((prev) => ({
          ...prev,
          status: "COMPLETED",
          progress: 100,
        }));
        eventSource?.close();
      });

      eventSource.addEventListener("ERROR", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setState((prev) => {
            if (prev.cards.length > 0) return { ...prev, status: "COMPLETED", progress: 100 };
            return {
              ...prev,
              status: "FAILED",
              error: data.message || "Failed to generate memory chain",
            };
          });
        } catch {
          setState((prev) => {
            if (prev.cards.length > 0) return { ...prev, status: "COMPLETED", progress: 100 };
            return {
              ...prev,
              status: "FAILED",
              error: "Streaming error occurred",
            };
          });
        }
        eventSource?.close();
      });

      eventSource.onerror = (err) => {
        console.warn("EventSource connection notice:", err);
      };
    }

    initStream();

    // 3. Fallback polling loop using authenticatedFetch
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await authenticatedFetch(`${baseUrl}/api/chains/${chainId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.cards && data.cards.length > 0) {
            setState((prev) => {
              const updatedCards: StoryCard[] = data.cards.map((c: any) => ({
                id: c.id,
                sequenceIndex: c.sequenceIndex,
                targetItem: c.targetItem,
                storySegment: c.storySegment,
                imagePrompt: c.imagePrompt,
                imageUrl: c.imageUrl || null,
                audioUrl: c.audioUrl || null,
              }));

              const isCompleted = data.status === "COMPLETED";
              return {
                ...prev,
                cards: updatedCards,
                topic: data.topic || prev.topic,
                totalItems: data.rawItems ? data.rawItems.length : prev.totalItems,
                status: isCompleted ? "COMPLETED" : prev.status === "COMPLETED" ? "COMPLETED" : "GENERATING",
                progress: isCompleted ? 100 : Math.min(100, Math.round((updatedCards.length / (data.rawItems?.length || 1)) * 100)),
              };
            });

            if (data.status === "COMPLETED") {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        } else if (res.status === 403 || res.status === 404) {
          setState({
            status: "FAILED",
            topic: "",
            totalItems: 0,
            cards: [],
            progress: 0,
            error: res.status === 403 ? "You do not have permission to view this memory chain." : "Memory chain not found.",
            audioError: null,
          });
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.warn("Fallback polling notice:", err);
      }
    }, 3000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [chainId, getSseTicket, authenticatedFetch]);

  const updateCardImage = (cardId: string, imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? { ...c, imageUrl } : c)),
    }));
  };

  return { ...state, updateCardImage };
}
