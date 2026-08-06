"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, Globe, ListOrdered, Loader2 } from "lucide-react";

export function ChainCreateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [itemsRaw, setItemsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const items = itemsRaw
      .split(/[\n,]/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (items.length === 0) {
      setError("Please provide at least 1 item to learn.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/chains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || "Memory Chain",
          targetLanguage,
          items,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.id) {
        router.push(`/chains/${data.id}`);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to initiate story generation");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
            Create Mnemonic Memory Chain
          </h2>
          <p className="text-sm text-slate-400">
            AI-powered surreal story generation connecting your target items into memorable visual hooks.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-200 text-sm flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            Topic / Category Name
          </label>
          <input
            type="text"
            placeholder="e.g. Spanish Animals, Organic Chemistry, World Capitals"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Target Language / Context
          </label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          >
            <option value="Spanish">Spanish</option>
            <option value="German">German</option>
            <option value="English">English</option>
            <option value="Polish">Polish</option>
            <option value="French">French</option>
            <option value="Italian">Italian</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-emerald-400" />
            Target Learning Items (comma or line separated)
          </label>
          <textarea
            rows={4}
            placeholder="perro&#10;gato&#10;caballo&#10;pájaro"
            value={itemsRaw}
            onChange={(e) => setItemsRaw(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Enter each vocabulary word or phrase on a new line or separated by commas.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initiating AI Story Stream...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Surreal Memory Chain</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
