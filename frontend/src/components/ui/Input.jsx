import { forwardRef, useId } from 'react';
import styles from './Field.module.css';

export const Input = forwardRef(function Input(
  { label, icon: Icon, suffix, error, hint, className, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className={[styles.field, error && styles.invalid, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={[styles.control, Icon && styles.hasIcon, suffix && styles.hasSuffix].filter(Boolean).join(' ')}>
        {Icon && (
          <span className={styles.icon}>
            <Icon size={18} />
          </span>
        )}
        <input ref={ref} id={id} className={styles.input} aria-invalid={Boolean(error) || undefined} {...rest} />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
});

export const TextArea = forwardRef(function TextArea({ label, error, hint, className, id: idProp, ...rest }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className={[styles.field, error && styles.invalid, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.control}>
        <textarea ref={ref} id={id} className={`${styles.input} ${styles.textarea}`} aria-invalid={Boolean(error) || undefined} {...rest} />
      </div>
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
});

export function SuffixButton({ children, ...rest }) {
  return (
    <button type="button" className={styles.suffixBtn} {...rest}>
      {children}
    </button>
  );
}

export default Input;
