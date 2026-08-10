import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memochain — Multimodal Memory Chain Engine",
  description: "AI-powered surreal story generation & visual memory chain streaming",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-on-background font-body select-none">
        <div className="paper-grain" />
        {children}
      </body>
    </html>
  );
}


