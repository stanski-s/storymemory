import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StoryCardCarousel } from "./StoryCardCarousel";
import { StoryCard } from "@/types/chain";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className}>{children}</div>,
    img: ({ children, className, src, alt }: any) => <img className={className} src={src} alt={alt} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("StoryCardCarousel Component", () => {
  const mockCards: StoryCard[] = [
    {
      id: "card-1",
      sequenceIndex: 0,
      targetItem: "perro",
      storySegment: "A glowing neon dog dances on top of a giant sombrero.",
      imagePrompt: "Surreal digital art of a glowing neon dog dancing on a giant hat",
      imageUrl: "http://localhost:9000/pamiec-media/images/card0.png",
    },
    {
      id: "card-2",
      sequenceIndex: 1,
      targetItem: "gato",
      storySegment: "Suddenly a floating space cat shoots lasers.",
      imagePrompt: "Surreal art of a galactic cosmic cat shooting lasers",
      imageUrl: null,
    },
  ];

  it("renders the active card target item and story segment", () => {
    render(<StoryCardCarousel cards={mockCards} isGenerating={false} />);

    expect(screen.getByText("perro")).toBeInTheDocument();
    expect(screen.getByText("A glowing neon dog dances on top of a giant sombrero.")).toBeInTheDocument();
  });

  it("displays card image when imageUrl is present", () => {
    render(<StoryCardCarousel cards={mockCards} isGenerating={false} />);

    const img = screen.getByRole("img", { name: /perro/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://localhost:9000/pamiec-media/images/card0.png");
  });

  it("renders inherited keyframe image and on-demand button when navigating to card without imageUrl", () => {
    const onGenerate = vi.fn();
    render(<StoryCardCarousel cards={mockCards} isGenerating={true} onGenerateImageOnDemand={onGenerate} />);

    const nextBtn = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText("gato")).toBeInTheDocument();
    expect(screen.getByText("Continued scene")).toBeInTheDocument();

    const generateBtn = screen.getByRole("button", { name: /Generate image/i });
    expect(generateBtn).toBeInTheDocument();


    fireEvent.click(generateBtn);
    expect(onGenerate).toHaveBeenCalledWith("card-2");
  });


  it("navigates card stack using vertical swipe gestures", () => {
    render(<StoryCardCarousel cards={mockCards} isGenerating={false} />);

    expect(screen.getByText("perro")).toBeInTheDocument();

    const swipeContainer = screen.getByTestId("swipe-container");
    
    // Simulate vertical swipe up (drag offset.y = -60)
    fireEvent.touchStart(swipeContainer, { touches: [{ clientY: 200 }] });
    fireEvent.touchMove(swipeContainer, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(swipeContainer);

    // Or fire ArrowDown keyboard navigation
    fireEvent.keyDown(window, { key: "ArrowDown" });

    expect(screen.getByText("gato")).toBeInTheDocument();
  });

  it("renders audio player controls and allows play/pause toggle", () => {

    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    const audioCards: StoryCard[] = [
      {
        sequenceIndex: 0,
        targetItem: "pies",
        storySegment: "A dog playing music.",
        imagePrompt: "Dog playing guitar",
        imageUrl: "http://localhost:9000/pamiec-media/images/card0.png",
        audioUrl: "http://localhost:9000/pamiec-media/audio/card0.mp3",
      },
    ];

    render(<StoryCardCarousel cards={audioCards} isGenerating={false} />);

    expect(screen.getByText("Auto-Advance")).toBeInTheDocument();

    const playBtn = screen.getByRole("button", { name: /play audio/i });
    expect(playBtn).toBeInTheDocument();

    fireEvent.click(playBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
});

