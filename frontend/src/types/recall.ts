import { StoryCard } from './chain';

export type RecallMode = 'STEP_BY_STEP' | 'FULL_FORM' | 'CLOZE_STORY';

export interface RecallAnswerItem {
  sequenceIndex: number;
  userText: string;
  hintTier1Revealed: boolean;
  hintTier2Revealed: boolean;
}

export interface SubmitRecallRequest {
  mode: RecallMode;
  responses: RecallAnswerItem[];
}

export interface MemoryGapDto {
  id: string;
  sequenceIndex: number;
  targetItem: string;
  userSubmittedText: string;
  isCorrect: boolean;
  hintTier1Revealed: boolean;
  hintTier2Revealed: boolean;
  storyCard: StoryCard;
}

export interface RecallSessionResult {
  sessionId: string;
  chainId: string;
  accuracyScore: number;
  totalItems: number;
  correctCount: number;
  gapCount: number;
  mode: RecallMode;
  gaps: MemoryGapDto[];
  createdAt: string;
}

export interface RecallSummaryResponse {
  chainId: string;
  totalSessions: number;
  latestAccuracyScore: number | null;
  averageAccuracyScore: number | null;
  bestAccuracyScore: number | null;
  latestSession: RecallSessionResult | null;
  latestSessionGaps: MemoryGapDto[];
}
