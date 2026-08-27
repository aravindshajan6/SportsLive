import { useId } from 'react';

/**
 * Sportscast logo — icon mark (football + broadcast waves on a brand-gradient tile) and a wordmark
 * whose "cast" is gradient-filled. Everything is inline SVG so it stays crisp in both themes.
 *
 * Props:
 *  - height: px height of the logo (default 40)
 *  - variant: 'auto' (text follows --text), 'light' (white text, for dark/hero panels), 'dark' (navy text)
 *  - markOnly: render just the icon tile
 */
export default function BrandLogo({ height = 40, variant = 'auto', markOnly = false, className, title = 'Sportscast' }) {
  const uid = useId().replace(/:/g, '');
  const gTile = `sc-tile-${uid}`;
  const gText = `sc-text-${uid}`;
  const textColor = variant === 'light' ? '#ffffff' : variant === 'dark' ? '#12113a' : 'currentColor';
  const viewW = markOnly ? 64 : 268;
  const width = Math.round(height * (viewW / 64));

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${viewW} 64`}
      role="img"
      aria-label={title}
      style={{ color: 'var(--text)', display: 'block', flex: '0 0 auto' }}
    >
      <defs>
        <linearGradient id={gTile} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b4bff" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id={gText} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c6cff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* icon tile */}
      <rect width="64" height="64" rx="16" fill={`url(#${gTile})`} />
      <path d="M35 29a17 17 0 0 1 8 12" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity=".95" />
      <path d="M39 22a25 25 0 0 1 11.5 17.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity=".7" />
      <path d="M43 15a33 33 0 0 1 15 23" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity=".45" />
      <circle cx="24" cy="41" r="11.5" fill="#fff" />
      <polygon points="24,35.2 29.6,39.2 27.5,45.8 20.5,45.8 18.4,39.2" fill="#12113a" />
      <g stroke="#12113a" strokeWidth="2" strokeLinecap="round">
        <line x1="24" y1="35.2" x2="24" y2="30" />
        <line x1="29.6" y1="39.2" x2="34.6" y2="37.4" />
        <line x1="27.5" y1="45.8" x2="30.4" y2="50.2" />
        <line x1="20.5" y1="45.8" x2="17.6" y2="50.2" />
        <line x1="18.4" y1="39.2" x2="13.4" y2="37.4" />
      </g>
      {!markOnly && (
        <text
          x="78"
          y="44"
          fontFamily="'Space Grotesk', 'Inter', system-ui, sans-serif"
          fontWeight="700"
          fontSize="36"
          letterSpacing="-1"
          fill={textColor}
        >
          Sports
          <tspan fill={`url(#${gText})`}>cast</tspan>
        </text>
      )}
    </svg>
  );
}
