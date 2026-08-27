import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import AboutSection from './AboutSection.jsx';
import ContactSection from './ContactSection.jsx';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  useDocumentTitle('About & contact');
  return (
    <div className={styles.page}>
      <AboutSection />
      <ContactSection />
    </div>
  );
}
