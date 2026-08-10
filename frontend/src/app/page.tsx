import Link from "next/link";
import { ChainCreateForm } from "@/components/ChainCreateForm";
import { Sparkles, Brain, Lightbulb, Compass, Flame, Smile, Layers, BookOpen, User } from "lucide-react";


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-5xl mx-auto space-y-10 relative z-10">
      {/* Top Header / Navigation */}
      <header className="flex items-center justify-between py-4 px-6 bg-[#efeee3] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rounded-2xl -rotate-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl border-2 border-[#1b1c15] bg-[#fdc425] shadow-[2px_2px_0px_0px_#1b1c15] flex items-center justify-center text-[#1b1c15] -rotate-3">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-[#785a00] italic leading-none flex items-center gap-2">
              Memochain
              <span className="font-mono-label text-xs px-2.5 py-0.5 rounded-md bg-[#4648d4] text-white border-2 border-[#1b1c15] not-italic shadow-[2px_2px_0px_0px_#1b1c15]">
                v0.2.0
              </span>
            </h1>
            <p className="font-mono-label text-[11px] text-[#464554] tracking-wider uppercase mt-0.5">
              Multimodal Memory Chain
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold text-[#002109] bg-[#6bff8f] hover:bg-[#4ae176] px-4 py-2.5 md:px-5 md:py-3 rounded-xl border-4 border-[#1b1c15] shadow-[5px_5px_0px_0px_#1b1c15] brutal-btn transition-all uppercase tracking-wider cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-[#00873b]" />
            <span>My Stories</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold text-[#ffffff] bg-[#4648d4] hover:bg-[#6063ee] px-4.5 py-2.5 md:px-5.5 md:py-3 rounded-xl border-4 border-[#1b1c15] shadow-[5px_5px_0px_0px_#1b1c15] brutal-btn transition-all uppercase tracking-wider cursor-pointer"
          >
            <User className="w-5 h-5 text-[#fdc425]" />
            <span>Sign In</span>
          </Link>
        </div>


      </header>

      {/* Hero Section */}
      <section className="space-y-6 text-center md:text-left py-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#fdc425] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] text-[#6d5200] font-mono-label text-xs font-bold uppercase tracking-wider -rotate-1">
          <Flame className="w-4 h-4 text-[#1b1c15]" />
          Visual Memory Training & Mnemonic Storytelling
        </div>

        <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-[#1b1c15] leading-[1.15]">
          Transform Words into <br />
          <span className="bg-[#4648d4] text-[#ffffff] px-4 py-1 inline-block border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rotate-1 mt-2">
            Unforgettable Stories
          </span>
        </h2>

        <p className="font-body text-base md:text-lg text-[#464554] max-w-2xl leading-relaxed">
          Link complex terms into vivid, whimsical visual stories with image & audio narration.
          Harness your imagination and memorize effortlessly through surreal associations!
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <div className="px-3.5 py-2 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] font-mono-label text-xs text-[#1b1c15] font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#785a00]" />
            "A Picture is Worth a Thousand Words"
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] font-mono-label text-xs text-[#1b1c15] font-bold flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#4648d4]" />
            "In the Mind's Eye"
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#ffffff] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] font-mono-label text-xs text-[#1b1c15] font-bold flex items-center gap-2">
            <Smile className="w-4 h-4 text-[#00873b]" />
            "Spark Your Imagination"
          </div>
        </div>
      </section>

      {/* Chain Generator Form */}
      <section className="py-2">
        <ChainCreateForm />
      </section>

      {/* Inspiring Mnemonic Cards Grid (Different Colors & Wise Quotes) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
        {/* Card 1: Quote (Yellow) */}
        <div className="relative bg-[#fdc425] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 rounded-2xl -rotate-1 hover:rotate-0 transition-transform">
          <div className="absolute -top-4 left-4 bg-[#ffffff] border-2 border-[#1b1c15] px-3 py-1 font-mono-label text-xs font-bold text-[#1b1c15] uppercase tracking-wider shadow-[2px_2px_0px_0px_#1b1c15]">
            💡 WISDOM OF THE DAY
          </div>
          <div className="space-y-3 pt-2">
            <p className="font-display text-xl font-extrabold text-[#1b1c15] leading-snug italic">
              "Imagination is more important than knowledge. For knowledge is limited."
            </p>
            <p className="font-mono-label text-xs font-bold text-[#6d5200]">
              — Albert Einstein
            </p>
            <p className="font-body text-xs text-[#1b1c15] leading-relaxed pt-2 border-t-2 border-[#1b1c15]/20">
              Your brain loves vivid imagery! Vivid visual mental hooks build up to 5x stronger neural connections than plain text.
            </p>
          </div>
        </div>

        {/* Card 2: Trivia (Cosmic Blue) */}
        <div className="relative bg-[#4648d4] text-[#ffffff] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 rounded-2xl rotate-1 hover:rotate-0 transition-transform">
          <div className="absolute -top-4 left-4 bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] px-3 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#1b1c15]">
            🔮 VON RESTORFF EFFECT
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-bold text-[#ffffff]">
              The More Surreal, The Better!
            </h3>
            <p className="font-body text-xs leading-relaxed opacity-95">
              Psychology proves that unusual, humorous, and high-contrast visuals stick longest. When you link words into a wild narrative, your mind recalls them automatically!
            </p>
          </div>
        </div>

        {/* Card 3: Encouragement (Warm Parchment / White) */}
        <div className="relative bg-[#ffffff] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 rounded-2xl -rotate-1 hover:rotate-0 transition-transform">
          <div className="absolute -top-4 left-4 bg-[#4648d4] text-[#ffffff] border-2 border-[#1b1c15] px-3 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#1b1c15]">
            🌟 STEP BY STEP
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-bold text-[#1b1c15] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#4648d4]" />
              Every Word is a New Adventure
            </h3>
            <p className="font-body text-xs text-[#464554] leading-relaxed">
              No rote learning needed. Just close your eyes, immerse in the story, and watch words connect effortlessly in your mind!
            </p>
          </div>
        </div>

        {/* Card 4: Historical Fact (Slime Green) */}
        <div className="relative bg-[#6bff8f] text-[#002109] border-4 border-[#1b1c15] shadow-[8px_8px_0px_0px_#1b1c15] p-6 rounded-2xl rotate-1 hover:rotate-0 transition-transform">
          <div className="absolute -top-4 left-4 bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] px-3 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#1b1c15]">
            🏛️ METHOD OF LOCI
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-bold text-[#002109]">
              Ancient Greek Mnemonic Art
            </h3>
            <p className="font-body text-xs leading-relaxed text-[#003816] font-medium">
              Sequential story linking (Mnemonic Chains) has over 2,500 years of history. Ancient orators delivered hours of speeches completely by memory without notes!
            </p>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="pt-6 border-t-4 border-[#1b1c15] flex flex-col md:flex-row items-center justify-between font-mono-label text-xs text-[#767586] gap-4">
        <p>© 2026 Memochain — Multimodal Mnemonic Story Engine.</p>
        <div className="flex space-x-3">
          <span className="px-3 py-1 bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] rounded-lg font-bold shadow-[2px_2px_0px_0px_#1b1c15]">
            ✨ Spark Imagination
          </span>
          <span className="px-3 py-1 bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] rounded-lg font-bold shadow-[2px_2px_0px_0px_#1b1c15]">
            🧠 Unlimited Memory
          </span>
        </div>
      </footer>
    </main>
  );
}



