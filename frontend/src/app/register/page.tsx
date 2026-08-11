"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Mail, Lock, UserPlus, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/stories";

  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !password) {
      setError("Wszystkie pola są wymagane.");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(email, password, displayName);
      router.push(returnUrl);
    } catch (err: any) {
      setError(err.message || "Błąd rejestracji. Podany email może być już zajęty.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto my-6">
      <div className="absolute -top-4 left-4 z-20 bg-[#fdc425] text-[#1b1c15] border-2 border-[#1b1c15] px-4 py-1 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#1b1c15] -rotate-2 rounded-md">
        NOWE KONTO
      </div>

      <div className="bg-[#ffffff] border-4 border-[#1b1c15] shadow-[10px_10px_0px_0px_#1b1c15] p-6 md:p-8 rounded-2xl space-y-6 rotate-1">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#6bff8f] border-2 border-[#1b1c15] shadow-[3px_3px_0px_0px_#1b1c15] -rotate-3 text-[#002109]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#1b1c15]">
              Dołącz do Memochain
            </h1>
            <p className="font-body text-xs text-[#464554]">
              Załóż bezpłatne konto i zapamiętuj trudne pojęcia bez wysiłku.
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
              Imię / Nazwa Użytkownika
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jan Kowalski"
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-3 font-body text-sm text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-display text-sm font-bold text-[#1b1c15] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#00873b]" />
              Adres Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj.email@example.com"
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-3 font-body text-sm text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-display text-sm font-bold text-[#1b1c15] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#fdc425]" />
              Hasło
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 znaków"
              className="comic-input w-full bg-[#f5f4e8] border-4 border-[#1b1c15] p-3 font-body text-sm text-[#1b1c15] placeholder-[#767586] focus:bg-[#ffffff] focus:border-[#4648d4] focus:outline-none rounded-xl shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.06)]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-[#6bff8f] hover:bg-[#52ea76] text-[#002109] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] brutal-btn font-display text-lg font-extrabold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5 text-[#002109]" />
            <span>{isSubmitting ? "Tworzenie konta..." : "Zarejestruj konto"}</span>
          </button>
        </form>

        <div className="text-center font-mono-label text-xs text-[#767586] pt-2 border-t-2 border-[#1b1c15]/10">
          <span>Masz już konto? </span>
          <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-bold text-[#4648d4] underline">
            Zaloguj się tutaj
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background text-on-background p-4 md:p-8 max-w-5xl mx-auto space-y-8 relative z-10">
      <header className="flex items-center justify-between py-4 px-6 bg-[#efeee3] border-4 border-[#1b1c15] shadow-[6px_6px_0px_0px_#1b1c15] rounded-2xl -rotate-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold text-[#1b1c15] bg-[#ffffff] hover:bg-[#f5f4e8] px-4.5 py-2.5 md:px-5 md:py-3 rounded-xl border-4 border-[#1b1c15] shadow-[4px_4px_0px_0px_#1b1c15] brutal-btn transition-all uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-[#4648d4]" />
          <span>Powrót do Strony Głównej</span>
        </Link>

        <div className="flex items-center gap-2 font-display text-xl md:text-2xl font-extrabold text-[#1b1c15]">
          <UserPlus className="w-6 h-6 text-[#00873b]" />
          <span>Rejestracja</span>
        </div>
      </header>

      <Suspense fallback={<div className="text-center p-8 font-display">Ładowanie...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
