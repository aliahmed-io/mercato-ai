import React from "react";
import { AudioLines } from "lucide-react";

interface MercatoLogoProps {
  className?: string;
  size?: number;
}

/**
 * Mercato — Precision AudioLines / Waveform Brand Mark in Acid Lime
 */
export function MercatoLogo({ className = "", size = 28 }: MercatoLogoProps) {
  return (
    <AudioLines
      size={size}
      strokeWidth={2}
      className={`text-[#D4FF24] shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
