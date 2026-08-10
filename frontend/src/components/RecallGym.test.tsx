import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecallGym } from "./RecallGym";
import { StoryCard } from "@/types/chain";

const mockCards: StoryCard[] = [
  {
    id: "card-1",
    sequenceIndex: 0,
    targetItem: "el perro",
    storySegment: "Un perro baila en la calle.",
    imagePrompt: "Dog dancing",
    imageUrl: "http://localhost/dog.png",
    audioUrl: "http://localhost/dog.mp3",
  },
  {
    id: "card-2",
    sequenceIndex: 1,
    targetItem: "el gato",
    storySegment: "Un gato toca la guitarra.",
    imagePrompt: "Cat playing guitar",
    imageUrl: "http://localhost/cat.png",
    audioUrl: "http://localhost/cat.mp3",
  },
];

describe("RecallGym Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders step-by-step mode by default and reveals image hint", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chainId: "chain-1",
        totalSessions: 0,
        latestAccuracyScore: null,
        averageAccuracyScore: null,
        bestAccuracyScore: null,
        latestSession: null,
        latestSessionGaps: [],
      }),
    });

    render(<RecallGym chainId="chain-1" cards={mockCards} />);

    expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Wpisz zapamiętane słowo/i)).toBeInTheDocument();

    // Click Tier 1 image hint button
    const tier1Button = screen.getByRole("button", { name: /Podpowiedź wizualna/i });
    fireEvent.click(tier1Button);

    expect(screen.getByAltText(/Podpowiedź do krok 1/i)).toBeInTheDocument();
  });

  it("submits session and displays accuracy score and memory gaps in summary", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: "chain-1",
          totalSessions: 0,
          latestAccuracyScore: null,
          averageAccuracyScore: null,
          bestAccuracyScore: null,
          latestSession: null,
          latestSessionGaps: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: "sess-1",
          chainId: "chain-1",
          accuracyScore: 75.0,
          totalItems: 2,
          correctCount: 2,
          gapCount: 1,
          mode: "STEP_BY_STEP",
          gaps: [
            {
              id: "gap-1",
              sequenceIndex: 1,
              targetItem: "el gato",
              userSubmittedText: "el gato",
              isCorrect: true,
              hintTier1Revealed: true,
              hintTier2Revealed: false,
              storyCard: mockCards[1],
            },
          ],
          createdAt: new Date().toISOString(),
        }),
      });

    render(<RecallGym chainId="chain-1" cards={mockCards} />);

    // Step 1: type answer and click next
    const input = screen.getByPlaceholderText(/Wpisz zapamiętane słowo/i);
    fireEvent.change(input, { target: { value: "el perro" } });
    fireEvent.click(screen.getByRole("button", { name: /Następne słowo/i }));

    // Step 2: type answer and submit
    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument();
    });

    const input2 = screen.getByPlaceholderText(/Wpisz zapamiętane słowo/i);
    fireEvent.change(input2, { target: { value: "el gato" } });
    fireEvent.click(screen.getByRole("button", { name: /Zakończ i sprawdź wynik/i }));

    await waitFor(() => {
      expect(screen.getByText(/75%/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory Gaps/i)).toBeInTheDocument();
    });
  });

  it("switches to CLOZE_STORY mode and renders story segments with blanks", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chainId: "chain-1",
        totalSessions: 0,
        latestAccuracyScore: null,
        averageAccuracyScore: null,
        bestAccuracyScore: null,
        latestSession: null,
        latestSessionGaps: [],
      }),
    });

    render(<RecallGym chainId="chain-1" cards={mockCards} />);

    // Click mode switch button for Wypełnianie Historii
    const clozeButton = screen.getByRole("button", { name: /Wypełnianie Historii/i });
    fireEvent.click(clozeButton);

    expect(screen.getByText(/Tryb Wypełniania Historii/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("[ _____ ]")).toHaveLength(2);
  });
});
