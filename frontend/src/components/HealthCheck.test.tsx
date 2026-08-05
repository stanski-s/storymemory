import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthCheck } from "./HealthCheck";

describe("HealthCheck Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders status UP when backend returns healthy response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "UP",
        timestamp: "2026-08-04T10:00:00Z",
        virtualThreadsEnabled: true,
        isVirtualThread: true,
      }),
    } as Response);

    render(<HealthCheck />);

    expect(screen.getByText("Backend Infrastructure Status")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("UP")).toBeInTheDocument();
      expect(screen.getByText("ENABLED (Loom)")).toBeInTheDocument();
    });
  });

  it("renders OFFLINE when backend fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection error"));

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    });
  });
});
