import React from "react";

interface FulcrumDividerProps {
  label?: string;
  tilt?: "level" | "left" | "right";
  className?: string;
}

export function FulcrumDivider({
  label,
  className = "",
}: FulcrumDividerProps) {
  return (
    <div
      className={`w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 ${className}`}
      role="separator"
      aria-label={label || "Section divider"}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1558C9]/45 to-transparent" />
    </div>
  );
}
