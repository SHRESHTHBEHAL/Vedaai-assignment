import React from "react";

// Logo for VedaAI
export function LogoVedaAI({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="38"
        height="38"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
        <path
          d="M11 12H15.5L20 25L24.5 12H29L22 30H18L11 12Z"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7E40" />
            <stop offset="100%" stopColor="#FF4136" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-2xl font-black tracking-tight text-[#14213d]">
        Veda<span className="text-[#FF5A36]">AI</span>
      </span>
    </div>
  );
}

// Custom school avatar cartoon (Delhi Public School avatar)
export function AvatarSchool({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full bg-[#FFEAE0] ring-2 ring-white shadow-sm ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* Background gradient */}
        <circle cx="50" cy="50" r="50" fill="#FFDFC8" />
        
        {/* Body/Shirt (Yellow) */}
        <path d="M20 90 C 20 70, 80 70, 80 90 Z" fill="#FAD02C" />
        {/* Collar */}
        <path d="M40 70 L 50 82 L 60 70 Z" fill="#E2B710" />
        
        {/* Neck */}
        <rect x="44" y="58" width="12" height="15" rx="3" fill="#F8C39E" />
        
        {/* Face */}
        <circle cx="50" cy="45" r="22" fill="#F8C39E" />
        
        {/* Ears */}
        <circle cx="28" cy="45" r="5" fill="#F8C39E" />
        <circle cx="72" cy="45" r="5" fill="#F8C39E" />
        
        {/* Eyes (behind glasses) */}
        <circle cx="42" cy="44" r="2.5" fill="#14213D" />
        <circle cx="58" cy="44" r="2.5" fill="#14213D" />
        
        {/* Glasses (Red frames, black lens outlines) */}
        <rect x="34" y="38" width="14" height="11" rx="3" stroke="#FF4136" strokeWidth="2.5" fill="none" />
        <rect x="52" y="38" width="14" height="11" rx="3" stroke="#FF4136" strokeWidth="2.5" fill="none" />
        <line x1="48" y1="43" x2="52" y2="43" stroke="#FF4136" strokeWidth="2.5" />
        <line x1="28" y1="41" x2="34" y2="41" stroke="#FF4136" strokeWidth="2" />
        <line x1="66" y1="41" x2="72" y2="41" stroke="#FF4136" strokeWidth="2" />
        
        {/* Beard (Brown) */}
        <path d="M30 46 C 30 62, 70 62, 70 46 C 70 56, 30 56, 30 46 Z" fill="#784B24" />
        <path d="M44 54 C 44 56, 56 56, 56 54 Z" fill="#784B24" />
        
        {/* Cap (Beige/Tan) */}
        <path d="M28 35 C 28 16, 72 16, 72 35 Z" fill="#D3C2B0" />
        {/* Cap Visor */}
        <path d="M22 34 C 30 28, 70 28, 78 34 C 78 37, 22 37, 22 34 Z" fill="#BCA691" />
        {/* Cap Button */}
        <circle cx="50" cy="18" r="3" fill="#BCA691" />
      </svg>
    </div>
  );
}

// Custom user profile avatar (John Doe)
export function AvatarUser({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* Background Circle */}
        <circle cx="50" cy="50" r="50" fill="#FF8D6D" />
        
        {/* Shirt (Blue-Grey) */}
        <path d="M22 90 C 22 75, 78 75, 78 90 Z" fill="#4B6584" />
        
        {/* Neck */}
        <rect x="45" y="60" width="10" height="12" fill="#FAD390" />
        
        {/* Face */}
        <circle cx="50" cy="46" r="20" fill="#FAD390" />
        
        {/* Glasses (Black) */}
        <circle cx="42" cy="45" r="6" stroke="#1E272C" strokeWidth="2.5" fill="none" />
        <circle cx="58" cy="45" r="6" stroke="#1E272C" strokeWidth="2.5" fill="none" />
        <line x1="48" y1="45" x2="52" y2="45" stroke="#1E272C" strokeWidth="2.5" />
        
        {/* Grey Hair */}
        <path d="M30 38 C 30 22, 70 22, 70 38 C 74 38, 72 32, 68 28 C 60 22, 40 22, 32 28 C 28 32, 26 38, 30 38 Z" fill="#D2D7D9" />
        
        {/* White mustache/beard */}
        <path d="M40 52 C 43 55, 57 55, 60 52 C 57 58, 43 58, 40 52 Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

// Unified, high-end vector illustration of the empty state dashboard
export function IllustrationEmptyState({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto max-w-[340px]"
      >
        {/* Decorative Loop/Swirl Line (Matches Figma exactly) */}
        <path
          d="M90 120 C 60 85, 110 50, 102 95 C 95 130, 125 155, 160 170 C 185 180, 205 150, 195 125"
          stroke="#14213d"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="1 1"
          opacity="0.25"
          fill="none"
        />
        <path
          d="M94 116 C 90 90, 115 72, 130 96 C 145 120, 120 145, 96 128 C 84 120, 92 100, 102 95"
          stroke="#14213d"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Small floating card (top right) */}
        <g filter="url(#shadow-sub)">
          <rect x="180" y="65" width="36" height="20" rx="6" fill="white" />
          <rect x="186" y="71" width="12" height="8" rx="2" fill="#E2E8F0" />
          <circle cx="206" cy="75" r="2" fill="#A0AEC0" />
        </g>

        {/* Base Document (White Sheet with Lines) */}
        <g filter="url(#shadow-doc)">
          <rect x="110" y="70" width="70" height="95" rx="8" fill="white" />
          {/* Top colored identifier line */}
          <rect x="120" y="82" width="22" height="4" rx="2" fill="#14213D" />
          {/* Sheet text lines */}
          <rect x="120" y="93" width="50" height="3" rx="1.5" fill="#E2E8F0" />
          <rect x="120" y="101" width="42" height="3" rx="1.5" fill="#E2E8F0" />
          <rect x="120" y="109" width="48" height="3" rx="1.5" fill="#E2E8F0" />
          <rect x="120" y="117" width="34" height="3" rx="1.5" fill="#E2E8F0" />
          <rect x="120" y="125" width="40" height="3" rx="1.5" fill="#E2E8F0" />
        </g>

        {/* Magnifying Glass (Overlays the document) */}
        <g filter="url(#shadow-glass)">
          {/* Glass Handle */}
          <path
            d="M174 162 L202 190"
            stroke="#C0C8D6"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M178 166 L198 186"
            stroke="#8F9CAE"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M198 186 L202 190"
            stroke="#4A5568"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Magnifying Lens (Circle) */}
          <circle
            cx="148"
            cy="136"
            r="26"
            fill="#EBF4FF"
            fillOpacity="0.82"
            stroke="#D1D5DB"
            strokeWidth="3.5"
          />
          {/* Glass glare highlight */}
          <path
            d="M132 124 A 20 20 0 0 1 158 118"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* Red circle with bold white "X" inside (perfectly placed inside lens) */}
        <g filter="url(#shadow-x)">
          <circle cx="148" cy="136" r="14" fill="#FF4136" />
          <path
            d="M142 130 L154 142 M154 130 L142 142"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>

        {/* Blue Sparkle (Left) */}
        <path
          d="M102 154 Q105 159 110 160 Q105 161 102 166 Q101 161 96 160 Q101 159 102 154 Z"
          fill="#3B82F6"
        />

        {/* Sparkle Outline (Top Left) */}
        <path
          d="M115 110 Q118 114 122 115 Q118 116 115 120 Q114 116 110 115 Q114 114 115 110 Z"
          stroke="#475569"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />

        {/* Soft Grey Sparkles / Dots */}
        <circle cx="210" cy="120" r="3" fill="#64748B" opacity="0.8" />
        <circle cx="206" cy="142" r="1.5" fill="#94A3B8" />
        <circle cx="92" cy="142" r="2" fill="#94A3B8" />

        {/* SVG Filters */}
        <defs>
          <filter id="shadow-doc" x="98" y="62" width="94" height="119" filterUnits="userSpaceOnUse">
            <feDropShadow dx="2" dy="6" stdDeviation="6" floodColor="#14213D" floodOpacity="0.08" />
          </filter>
          <filter id="shadow-sub" x="174" y="61" width="48" height="32" filterUnits="userSpaceOnUse">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#14213D" floodOpacity="0.05" />
          </filter>
          <filter id="shadow-glass" x="114" y="102" width="102" height="102" filterUnits="userSpaceOnUse">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#14213d" floodOpacity="0.08" />
          </filter>
          <filter id="shadow-x" x="131" y="121" width="34" height="34" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FF4136" floodOpacity="0.3" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
