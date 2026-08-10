"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, Cpu, RefreshCw, Server } from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  virtualThreadsEnabled?: boolean;
  isVirtualThread?: boolean;
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to backend";
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchHealth();
  }, []);

  return (
    <div className="relative w-full my-4">
      {/* Panel Cap / Badge */}
      <div className="absolute -top-4 left-4 z-20 bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] px-3 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-1 rounded-md">
        SYSTEM STATUS
      </div>

      <div className="bg-[#efeee3] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 rounded-2xl relative">
        <div className="flex items-center justify-between mb-4 pt-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] -rotate-2">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#1b1c15]">Backend Infrastructure Status</h3>
              <p className="font-mono-label text-xs text-[#464554]">Java 25 & Spring Boot 4 REST Endpoint</p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={!mounted || loading}
            className="p-2.5 rounded-xl bg-[#ffffff] hover:bg-[#f5f4e8] text-[#1b1c15] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] brutal-btn transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Health Status"
            id="refresh-health-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#4648d4]" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* Status Box */}
          <div className="p-4 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!mounted || loading ? (
                <Activity className="w-5 h-5 text-[#785a00] animate-pulse" />
              ) : error ? (
                <XCircle className="w-5 h-5 text-[#ba1a1a]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#00873b]" />
              )}
              <div>
                <p className="font-mono-label text-[11px] font-bold text-[#767586] uppercase tracking-wider">Status</p>
                <p className={`font-display text-sm font-extrabold ${error ? "text-[#ba1a1a]" : "text-[#00873b]"}`}>
                  {!mounted || loading ? "Checking..." : error ? "OFFLINE" : health?.status || "HEALTHY"}
                </p>
              </div>
            </div>
          </div>

          {/* Virtual Threads Box */}
          <div className="p-4 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-[#4648d4]" />
              <div>
                <p className="font-mono-label text-[11px] font-bold text-[#767586] uppercase tracking-wider">Virtual Threads</p>
                <p className="font-display text-sm font-extrabold text-[#4648d4]">
                  {mounted && health?.virtualThreadsEnabled ? "ENABLED (Loom)" : "Disabled / Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamp / Error Box */}
          <div className="p-4 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] flex items-center justify-between">
            <div>
              <p className="font-mono-label text-[11px] font-bold text-[#767586] uppercase tracking-wider">Last Sync</p>
              <p className="font-mono-label text-xs text-[#1b1c15] truncate max-w-[180px] font-semibold">
                {error ? error : (mounted && health?.timestamp) ? new Date(health.timestamp).toLocaleTimeString() : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

