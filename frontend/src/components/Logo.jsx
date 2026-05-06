import React from "react";

/** Foundry mark — anvil + spark, gold gradient. Use for header. */
export default function Logo({ size = 22, withWord = true, color = "#D4AF37" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Foundry">
        <defs>
          <linearGradient id="fdry-g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor="#FF7A1A" />
          </linearGradient>
        </defs>
        <path d="M14 26 H50 A4 4 0 0 1 54 30 V32 H44 L42 38 H22 L20 32 H10 V30 A4 4 0 0 1 14 26 Z" fill="url(#fdry-g)"/>
        <rect x="26" y="38" width="12" height="6" fill="url(#fdry-g)"/>
        <rect x="22" y="44" width="20" height="4" rx="1.5" fill="url(#fdry-g)"/>
        <circle cx="48" cy="20" r="2" fill={color}/>
        <circle cx="42" cy="14" r="1.2" fill={color}/>
      </svg>
      {withWord && (
        <span className="font-display tracking-tight" style={{ fontSize: size * 0.85 }}>
          Foundry
        </span>
      )}
    </span>
  );
}
