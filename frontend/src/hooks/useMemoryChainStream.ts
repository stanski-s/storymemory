"use client";

import { useEffect, useState } from "react";
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
          return { ...prev, cards };
        });
      } catch (err) {
        console.error("Error parsing CARD_IMAGE_GENERATED event", err);
      }
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
        setState((prev) => ({
          ...prev,
          status: "FAILED",
          error: data.message || "Failed to generate memory chain",
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          status: "FAILED",
          error: "Streaming error occurred",
        }));
      }
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setState((prev) => {
        if (prev.status === "COMPLETED") return prev;
        return {
          ...prev,
          status: "FAILED",
          error: "Connection lost with story stream service",
        };
      });
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [chainId]);

  return state;
}
