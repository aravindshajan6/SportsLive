import styles from './SectionHeading.module.css';

export default function SectionHeading({ eyebrow, title, description, children, as: Tag = 'h2', className }) {
  return (
    <div className={[styles.head, className].filter(Boolean).join(' ')}>
      <div>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <Tag className={styles.title}>{title}</Tag>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {children && <div className={styles.aside}>{children}</div>}
    </div>
  );
}
