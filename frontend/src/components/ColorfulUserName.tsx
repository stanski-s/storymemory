"use client";

import React from "react";

interface ColorfulUserNameProps {
  name: string;
  className?: string;
}

const PALETTE = [
  "#4648d4", // Electric Blue
  "#00873b", // Vibrant Green
  "#d97706", // Amber Gold
  "#e11d48", // Crimson Red
  "#9333ea", // Purple
  "#0284c7", // Sky Blue
];

export function ColorfulUserName({ name, className = "" }: ColorfulUserNameProps) {
  if (!name) return null;

  return (
    <span className={`font-display font-black text-lg md:text-xl tracking-wide inline-flex items-center select-none ${className}`}>
      {name.split("").map((char, idx) => {
        const color = PALETTE[idx % PALETTE.length];
        return (
          <span
            key={idx}
            style={{ color }}
            className="inline-block transform hover:-translate-y-0.5 transition-transform"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </span>
  );
}
