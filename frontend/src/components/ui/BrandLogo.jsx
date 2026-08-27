/**
 * Inline SVG recreation of the SportsLive wordmark (boxed text with a filled band below),
 * drawn in `currentColor` so it is crisp and adapts to both themes.
 * Props: height (px), color (CSS color; defaults to currentColor / theme text), className.
 */
export default function BrandLogo({ height = 40, color, className, title = 'SportsLive' }) {
  const width = Math.round(height * (240 / 96));
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 240 96"
      role="img"
      aria-label={title}
      style={{ color: color || 'var(--text)', display: 'block', flex: '0 0 auto' }}
    >
      <rect x="3" y="3" width="234" height="66" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
      <rect x="3" y="70" width="234" height="23" rx="3" fill="currentColor" />
      <text
        x="120"
        y="53"
        textAnchor="middle"
        fontFamily="'Space Grotesk', 'Inter', system-ui, sans-serif"
        fontWeight="600"
        fontSize="40"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        SportsLive
      </text>
    </svg>
  );
}
