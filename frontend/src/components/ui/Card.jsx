import { forwardRef } from 'react';
import styles from './Card.module.css';

const Card = forwardRef(function Card(
  { as: Tag = 'div', padded = true, interactive = false, glass = false, glow = false, className, children, ...rest },
  ref,
) {
  const cls = [
    styles.card,
    padded && styles.padded,
    interactive && styles.interactive,
    glass && styles.glass,
    glow && styles.glow,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag ref={ref} className={cls} {...rest}>
      {children}
    </Tag>
  );
});

export default Card;
