import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Props: variant = primary | gradient | secondary | ghost | outline | danger; size = sm | md | lg;
 * icon (boolean, square), block, loading, to (renders <Link>), href (renders <a>).
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon = false, block = false, loading = false, className, children, to, href, disabled, ...rest },
  ref,
) {
  const cls = cx(
    styles.btn,
    styles[variant],
    size !== 'md' && styles[size],
    icon && styles.icon,
    block && styles.block,
    className,
  );
  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} aria-disabled={disabled || loading || undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
});

export default Button;
