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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
    fetchHealth();
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Backend Infrastructure Status</h3>
            <p className="text-xs text-gray-400">Java 25 & Spring Boot 4 REST Endpoint</p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all disabled:opacity-50"
          title="Refresh Health Status"
          id="refresh-health-btn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {/* Status Box */}
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {loading ? (
              <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />
            ) : error ? (
              <XCircle className="w-5 h-5 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</p>
              <p className={`text-sm font-semibold ${error ? "text-rose-400" : "text-emerald-400"}`}>
                {loading ? "Checking..." : error ? "OFFLINE" : health?.status || "HEALTHY"}
              </p>
            </div>
          </div>
        </div>

        {/* Virtual Threads Box */}
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Virtual Threads</p>
              <p className="text-sm font-semibold text-purple-300">
                {health?.virtualThreadsEnabled ? "ENABLED (Loom)" : "Disabled / Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Timestamp / Error Box */}
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Last Sync</p>
            <p className="text-xs font-mono text-gray-300 truncate max-w-[180px]">
              {error ? error : health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
