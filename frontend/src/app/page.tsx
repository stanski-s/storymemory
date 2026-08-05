import { HealthCheck } from "@/components/HealthCheck";
import { Sparkles, Brain, Layers, Zap, ArrowRight, ShieldCheck, Database, LayoutGrid } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      {/* Top Header / Navigation */}
      <header className="flex items-center justify-between py-4 border-b border-gray-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Pamięć <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">v0.1.0</span>
            </h1>
            <p className="text-xs text-gray-400">Multimodal Memory Chain</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Java 25 & Next.js 16
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="space-y-6 text-center md:text-left py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          AI-Powered Mnemonic Storytelling Engine
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Transform Vocabulary into <br />
          <span className="text-gradient">Surreal Memory Chains</span>
        </h2>

        <p className="text-base md:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
          Link complex terms into vivid, action-packed visual stories streamed in real time. 
          Reinforce long-term retention with expressive audio narration, active recall gym, and Anki export.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <div className="px-4 py-2.5 rounded-xl glass-panel text-xs text-gray-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Virtual Threads Accelerated (Loom)
          </div>
          <div className="px-4 py-2.5 rounded-xl glass-panel text-xs text-gray-300 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            PostgreSQL & Flyway Migrations
          </div>
          <div className="px-4 py-2.5 rounded-xl glass-panel text-xs text-gray-300 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-pink-400" />
            Next.js App Router & Tailwind CSS
          </div>
        </div>
      </section>

      {/* Infrastructure & Health Verification Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> System Skeleton Infrastructure
          </h3>
        </div>

        <HealthCheck />
      </section>

      {/* Architectural Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">Generative SSE Pipeline</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Real-time Server-Sent Events stream surreal story text, illustrations, and audio narrations progressively.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="p-3 w-fit rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">Interactive Recall Gym</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Active recall testing with typo tolerance and progressive mnemonic hints for identified memory gaps.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="p-3 w-fit rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ArrowRight className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">Anki (.apkg) Engine</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Server-side SQLite deck generation bundling audio, images, and HTML memory cards for offline study.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-gray-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© 2026 Pamięć — Multimodal Memory Chain. Java 25 & Spring Boot 4 + Next.js.</p>
        <div className="flex space-x-6">
          <span>PostgreSQL DB</span>
          <span>Flyway V1 Schema</span>
          <span>Virtual Threads (Loom)</span>
        </div>
      </footer>
    </main>
  );
}
