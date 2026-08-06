import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChainCreateForm } from "./ChainCreateForm";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("ChainCreateForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders form elements correctly", () => {
    render(<ChainCreateForm />);
    expect(screen.getByText(/Create Mnemonic Memory Chain/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Spanish Animals/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Surreal Memory Chain/i })).toBeInTheDocument();
  });

  it("submits target items and redirects to /chains/[id]", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "123e4567-e89b-12d3-a456-426614174000", status: "GENERATING" }),
    });

    render(<ChainCreateForm />);

    fireEvent.change(screen.getByPlaceholderText(/Spanish Animals/i), {
      target: { value: "Spanish Vocabulary" },
    });
    fireEvent.change(screen.getByPlaceholderText(/perro/i), {
      target: { value: "perro\ngato" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Generate Surreal Memory Chain/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chains/123e4567-e89b-12d3-a456-426614174000");
    });
  });
});
