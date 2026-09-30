import React, { useState } from 'react';

/**
 * SkyGuardLogo - Official Aerospace Weather Intelligence Emblem
 * Features high-contrast SVG geometry, dynamic radar sweep, and raised tactile tap animation.
 */
export default function SkyGuardLogo({ size = 36, onClick, interactive = true }) {
  const [isTapped, setIsTapped] = useState(false);

  const handleClick = (e) => {
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 450);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : -1}
      aria-label="SkyGuard AI Mission Control Logo - Return to Overview"
      title="SkyGuard AI - Return to Mission Control"
      className={`skyguard-logo-badge ${isTapped ? 'logo-tapped' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="sgGradient1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="sgShieldBg" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>

          <filter id="sgGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hex-Shield Contour */}
        <path
          d="M24 4L40 10.5V23.5C40 33.2 33.2 41.8 24 44C14.8 41.8 8 33.2 8 23.5V10.5L24 4Z"
          fill="url(#sgShieldBg)"
          stroke="url(#sgGradient1)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Concentric Radar Rings */}
        <circle cx="24" cy="22" r="12" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.45" />
        <circle cx="24" cy="22" r="7" stroke="#0284c7" strokeWidth="1.2" opacity="0.65" />

        {/* Center Satellite AI Pulse Node */}
        <circle cx="24" cy="22" r="3.2" fill="#0284c7" />
        <circle cx="24" cy="22" r="1.5" fill="#ffffff" />

        {/* Weather Intelligence Cloud & Arrow Crest */}
        <path
          d="M17 26.5C15.8 26.5 15 25.5 15.2 24.3C15.5 22.8 17 21.6 18.5 21.6C18.9 20.2 20.4 19 22.2 19C24.3 19 26 20.5 26.2 22.4C27.5 22.6 28.5 23.6 28.5 24.8C28.5 26.2 27.3 26.5 26 26.5H17Z"
          fill="#38bdf8"
          opacity="0.35"
        />

        {/* Anomaly Detection Guard Wings */}
        <path
          d="M16 32L24 37L32 32"
          stroke="#0284c7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
