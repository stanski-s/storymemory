"use client";

import { useEffect, useState, useRef } from "react";
import { StoryCard } from "@/types/chain";

export interface StreamState {
  status: "IDLE" | "CONNECTING" | "GENERATING" | "COMPLETED" | "FAILED";
  topic: string;
  targetLanguage: string;
  totalItems: number;
  cards: StoryCard[];
  progress: number;
  error: string | null;
}

export function useMemoryChainStream(chainId: string | null) {
  const [state, setState] = useState<StreamState>({
    status: "IDLE",
    topic: "",
    targetLanguage: "",
    totalItems: 0,
    cards: [],
    progress: 0,
    error: null,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!chainId) return;

    setState((prev) => ({ ...prev, status: "CONNECTING", error: null }));

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const sseUrl = `${baseUrl}/api/chains/${chainId}/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("CHAIN_CREATED", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          status: "GENERATING",
          topic: data.topic || prev.topic,
          targetLanguage: data.targetLanguage || prev.targetLanguage,
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
        };

        setState((prev) => {
          const existing = prev.cards.find((c) => c.sequenceIndex === newCard.sequenceIndex);
          const updatedCard = existing ? { ...existing, ...newCard, imageUrl: newCard.imageUrl || existing.imageUrl } : newCard;
          const cards = existing
            ? prev.cards.map((c) => (c.sequenceIndex === newCard.sequenceIndex ? updatedCard : c))
            : [...prev.cards, updatedCard].sort((a, b) => a.sequenceIndex - b.sequenceIndex);

          const progress = prev.totalItems > 0 ? Math.min(100, Math.round((cards.length / prev.totalItems) * 100)) : 50;

          return {
            ...prev,
            cards,
            progress,
            status: "GENERATING",
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

    eventSource.addEventListener("PING", () => {
      // Heartbeat ping from server keeping connection active
    });

    eventSource.addEventListener("CHAIN_COMPLETED", () => {
      setState((prev) => ({
        ...prev,
        status: "COMPLETED",
        progress: 100,
      }));
      eventSource.close();
    });

    eventSource.addEventListener("ERROR", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setState((prev) => {
          if (prev.cards.length > 0) return prev; // Do not fail UI if story cards exist
          return {
            ...prev,
            status: "FAILED",
            error: data.message || "Failed to generate memory chain",
          };
        });
      } catch {
        setState((prev) => {
          if (prev.cards.length > 0) return prev;
          return {
            ...prev,
            status: "FAILED",
            error: "Streaming error occurred",
          };
        });
      }
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.warn("EventSource connection notice:", err);
      // NEVER fail the UI if we already received story cards!
      setState((prev) => {
        if (prev.cards.length > 0) {
          return prev;
        }
        return prev;
      });
    };

    // Fallback polling loop to sync with DB state every 3s in case SSE pauses or disconnects
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${baseUrl}/api/chains/${chainId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.cards && data.cards.length > 0) {
            setState((prev) => {
              const updatedCards: StoryCard[] = data.cards.map((c: { id: string; sequenceIndex: number; targetItem: string; storySegment: string; imagePrompt: string; imageUrl?: string }) => ({
                id: c.id,
                sequenceIndex: c.sequenceIndex,
                targetItem: c.targetItem,
                storySegment: c.storySegment,
                imagePrompt: c.imagePrompt,
                imageUrl: c.imageUrl || null,
              }));

              const isCompleted = data.status === "COMPLETED";
              return {
                ...prev,
                cards: updatedCards,
                topic: data.topic || prev.topic,
                targetLanguage: data.targetLanguage || prev.targetLanguage,
                totalItems: data.rawItems ? data.rawItems.length : prev.totalItems,
                status: isCompleted ? "COMPLETED" : prev.status === "COMPLETED" ? "COMPLETED" : "GENERATING",
                progress: isCompleted ? 100 : Math.min(100, Math.round((updatedCards.length / (data.rawItems?.length || 1)) * 100)),
              };
            });

            if (data.status === "COMPLETED") {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        }
      } catch (err) {
        console.warn("Fallback polling notice:", err);
      }
    }, 3000);

    return () => {
      eventSource.close();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [chainId]);

  const updateCardImage = (cardId: string, imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? { ...c, imageUrl } : c)),
    }));
  };

  return { ...state, updateCardImage };
}
