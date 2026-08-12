"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Lock, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/stories";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      router.push(returnUrl);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto my-6">
      <div className="absolute -top-4 left-4 z-20 bg-[#6bff8f] text-[#002109] border-2 border-[#1b1c15] px-4 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-2 rounded-md">
        ACCOUNT ACCESS
      </div>

      <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-6 md:p-8 rounded-2xl space-y-6 rotate-1">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#fdc425] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] -rotate-3 text-[#1b1c15]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#1b1c15]">
              Welcome Back
            </h1>
            <p className="font-body text-xs text-[#464554]">
              Sign in to access your saved mnemonic story chains and recall stats.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#ff6b6b] border-2 border-[#1b1c15] text-[#1b1c15] font-body text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#1b1c15]">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#1b1c15]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-display text-sm font-bold text-[#1b1c15] flex items-center gap-2">
              <User className="w-4 h-4 text-[#4648d4]" />
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dreamer@memochain.com"
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-3 font-body text-sm text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-display text-sm font-bold text-[#1b1c15] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00873b]" />
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-3 font-body text-sm text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-[#fdc425] hover:bg-[#f7be1d] text-[#1b1c15] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-lg font-extrabold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 text-[#1b1c15]" />
            <span>{isSubmitting ? "Signing in..." : "Sign In to Memochain"}</span>
          </button>
        </form>

        <div className="text-center font-mono-label text-xs text-[#767586] pt-2 border-t-2 border-[#1b1c15]/10">
          <span>Don't have an account? </span>
          <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-bold text-[#4648d4] underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-on-background p-4 md:p-8 max-w-5xl mx-auto space-y-8 relative z-10">
      <header className="flex items-center justify-between py-4 px-6 bg-[#efeee3] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rounded-2xl -rotate-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold text-[#1b1c15] bg-[#ffffff] hover:bg-[#f5f4e8] px-4.5 py-2.5 md:px-5 md:py-3 rounded-xl border-4 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] brutal-btn transition-all uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-[#4648d4]" />
          <span>Back to Generator</span>
        </Link>

        <div className="flex items-center gap-2 font-display text-xl md:text-2xl font-extrabold text-[#1b1c15]">
          <User className="w-6 h-6 text-[#4648d4]" />
          <span>Sign In</span>
        </div>
      </header>

      <Suspense fallback={<div className="text-center p-8 font-display">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
