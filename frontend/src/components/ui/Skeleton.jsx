import styles from './Skeleton.module.css';

export default function Skeleton({ width = '100%', height = 16, circle = false, text = false, className, style, ...rest }) {
  const cls = [styles.sk, circle && styles.circle, text && styles.text, className].filter(Boolean).join(' ');
  return <span className={cls} style={{ width, height, display: 'block', ...style }} aria-hidden="true" {...rest} />;
}

export function SkeletonLines({ lines = 3, widths = ['100%', '92%', '70%'] }) {
  return (
    <span style={{ display: 'block' }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} text width={widths[i % widths.length]} />
      ))}
    </span>
  );
}
