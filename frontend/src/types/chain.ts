export interface StoryCard {
  id?: string;
  sequenceIndex: number;
  targetItem: string;
  storySegment: string;
  imagePrompt: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

export interface MemoryChain {
  id: string;
  topic: string;
  rawItems: string[];
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  cards: StoryCard[];
}

export interface CreateChainPayload {
  topic: string;
  items: string[];
}
