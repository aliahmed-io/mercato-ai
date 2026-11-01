import React from "react";

interface MercatoLogoProps {
  className?: string;
  size?: number;
}

/**
 * Mercato — Nocturnal Cobalt & Acid-Lime Precision Balance Mark
 */
export function MercatoLogo({ className = "", size = 32 }: MercatoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Midnight Obsidian Background Tile with Electric Cobalt Rim */}
      <rect
        x="1"
        y="1"
        width="34"
        height="34"
        rx="9"
        fill="#0A0F1D"
        stroke="#1558C9"
        strokeWidth="1.25"
      />

      {/* Ambient Cobalt Glow */}
      <circle cx="18" cy="16" r="10" fill="#1558C9" fillOpacity="0.22" />

      {/* Central Pedestal & Fulcrum */}
      <path d="M18 15L14 27H22L18 15Z" fill="#1558C9" />
      <rect x="11" y="27" width="14" height="2.2" rx="1.1" fill="#F8FAFC" />

      {/* Precision Balance Beam */}
      <rect x="6" y="13.25" width="24" height="2.5" rx="1.25" fill="#F8FAFC" />

      {/* Suspended Pan Rods & Pans */}
      <line x1="9" y1="15.75" x2="9" y2="21.5" stroke="#3B82F6" strokeWidth="1.4" />
      <rect x="5.5" y="21.5" width="7" height="2" rx="1" fill="#D4FF24" />

      <line x1="27" y1="15.75" x2="27" y2="21.5" stroke="#3B82F6" strokeWidth="1.4" />
      <rect x="23.5" y="21.5" width="7" height="2" rx="1" fill="#1558C9" />

      {/* Acid Lime Pivot Core */}
      <circle cx="18" cy="14.5" r="3" fill="#D4FF24" />
      <circle cx="18" cy="14.5" r="1.2" fill="#030407" />
    </svg>
  );
}
