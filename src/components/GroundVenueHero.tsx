export function AxisMallHero({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 480"
      role="img"
      aria-label="Axis Mall football turf, New Town, Kolkata"
      className={className}
    >
      <defs>
        <linearGradient id="axis-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="axis-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d9a56" />
          <stop offset="100%" stopColor="#2a7a42" />
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#axis-sky)" />
      <rect x="0" y="320" width="800" height="160" fill="#e2e8f0" />
      <rect x="40" y="80" width="720" height="320" rx="16" fill="url(#axis-turf)" />
      <rect x="56" y="96" width="688" height="288" rx="8" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.55" />
      <line x1="400" y1="96" x2="400" y2="384" stroke="#ffffff" strokeWidth="3" opacity="0.45" />
      <circle cx="400" cy="240" r="48" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.45" />
      <rect x="56" y="168" width="80" height="144" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
      <rect x="664" y="168" width="80" height="144" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
      <text x="400" y="52" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="28" fontWeight="700" fill="#0f172a">
        Axis Mall
      </text>
      <text x="400" y="82" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="16" fill="#475569">
        New Town · Kolkata
      </text>
    </svg>
  );
}
