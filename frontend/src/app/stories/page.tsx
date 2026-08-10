import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles, PlusCircle } from "lucide-react";

export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-background text-on-background p-4 md:p-8 max-w-5xl mx-auto space-y-8 relative z-10">
      {/* Top Header */}
      <header className="flex items-center justify-between py-4 px-6 bg-[#efeee3] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rounded-2xl -rotate-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold text-[#1b1c15] bg-[#ffffff] hover:bg-[#f5f4e8] px-4.5 py-2.5 md:px-5 md:py-3 rounded-xl border-4 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] brutal-btn transition-all uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-[#4648d4]" />
          <span>Back to Generator</span>
        </Link>

        <div className="flex items-center gap-2 font-display text-xl md:text-2xl font-extrabold text-[#1b1c15]">
          <BookOpen className="w-6 h-6 text-[#4648d4]" />
          <span>My Stories</span>
        </div>

      </header>

      {/* Main Content Area */}
      <div className="relative w-full max-w-3xl mx-auto my-6">
        <div className="absolute -top-4 left-4 z-20 bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] px-4 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-1 rounded-md">
          STORY ARCHIVE
        </div>

        <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-8 md:p-12 rounded-2xl space-y-6 text-center rotate-1">
          <div className="w-16 h-16 rounded-2xl bg-[#6bff8f] border-2 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] flex items-center justify-center text-[#002109] mx-auto -rotate-3">
            <Sparkles className="w-8 h-8 text-[#00873b]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-extrabold text-[#1b1c15]">
              Your Saved Mnemonic Chains
            </h1>
            <p className="font-body text-sm text-[#464554] max-w-md mx-auto">
              Your generated story chains and visual memory cards will appear here. Create your first chain to start building your personal memory library!
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#4648d4] text-[#ffffff] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-lg font-bold uppercase transition-all"
            >
              <PlusCircle className="w-5 h-5 text-[#fdc425]" />
              <span>Create New Memory Story</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
