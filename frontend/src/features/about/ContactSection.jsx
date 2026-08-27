import { Mail, MapPin, Clock3 } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading.jsx';
import { useReveal } from '@/hooks/useReveal.js';
import ContactForm from './ContactForm.jsx';
import styles from './ContactSection.module.css';

const GithubIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);
const LinkedinIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);
const XIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
  </svg>
);

const CONTACTS = [
  { icon: MapPin, label: 'Based in', value: 'Kannur, Kerala, India', tint: 'live' },
  { icon: Mail, label: 'Email', value: 'aravindshajan6@gmail.com', href: 'mailto:aravindshajan6@gmail.com', tint: 'accent' },
  { icon: Clock3, label: 'Response time', value: 'Usually within 1–2 days', tint: 'success' },
];

const SOCIALS = [
  { icon: GithubIcon, label: 'GitHub', handle: 'aravindshajan6', href: 'https://github.com/aravindshajan6' },
  { icon: LinkedinIcon, label: 'LinkedIn', handle: 'Connect on LinkedIn', href: 'https://www.linkedin.com/' },
  { icon: XIcon, label: 'Twitter / X', handle: 'Follow on X', href: 'https://twitter.com/' },
];

export default function ContactSection() {
  const ref = useReveal([]);
  return (
    <section id="contact" className={`container section ${styles.section}`} ref={ref}>
      <SectionHeading
        eyebrow="Get in touch"
        title="Contact"
        description="Found a bug, have a feature idea, or just want to talk football? Drop a message — every note is read."
      />
      <div className={styles.grid}>
        <div className={styles.formCol} data-reveal>
          <ContactForm />
        </div>

        <aside className={styles.infoCol} data-reveal aria-label="Contact details">
          <div className={styles.infoCard}>
            <ul className={styles.infoList}>
              {CONTACTS.map(({ icon: Icon, label, value, href, tint }) => {
                const inner = (
                  <>
                    <span className={`${styles.infoIcon} ${styles[tint]}`}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className={styles.infoText}>
                      <span className={styles.infoLabel}>{label}</span>
                      <span className={styles.infoValue}>{value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a className={`${styles.infoItem} ${styles.infoLink}`} href={href}>
                        {inner}
                      </a>
                    ) : (
                      <div className={styles.infoItem}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className={styles.divider} role="presentation" />

            <h3 className={styles.socialTitle}>Find me online</h3>
            <ul className={styles.socialList}>
              {SOCIALS.map(({ icon: Icon, label, handle, href }) => (
                <li key={label}>
                  <a className={styles.social} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
                    <span className={styles.socialIcon}>
                      <Icon />
                    </span>
                    <span className={styles.infoText}>
                      <span className={styles.infoLabel}>{label}</span>
                      <span className={styles.infoValue}>{handle}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
