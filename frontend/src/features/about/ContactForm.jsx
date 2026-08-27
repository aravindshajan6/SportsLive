import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mail, MessageSquareText, Send, User } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button.jsx';
import Input, { TextArea } from '@/components/ui/Input.jsx';
import { contactApi } from '@/lib/api.js';
import { svg } from 'animejs';
import { animate, createTimeline, ensureVisible, prefersReducedMotion, stagger, utils } from '@/lib/anim.js';
import styles from './ContactForm.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: 80, message: 2000 };
const EMPTY = { name: '', email: '', message: '' };

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();
  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length > LIMITS.name) errors.name = `Keep it under ${LIMITS.name} characters.`;
  if (!email) errors.email = 'An email address is required so we can reply.';
  else if (!EMAIL_RE.test(email)) errors.email = 'That email address doesn’t look right.';
  if (!message) errors.message = 'Write a short message.';
  else if (message.length < 10) errors.message = 'A few more words please (at least 10 characters).';
  else if (message.length > LIMITS.message) errors.message = `Keep it under ${LIMITS.message} characters.`;
  return errors;
}

function SuccessPanel({ onReset }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const circle = root.querySelector('[data-draw-circle]');
    const tick = root.querySelector('[data-draw-tick]');
    const items = root.querySelectorAll('[data-success-item]');
    if (prefersReducedMotion()) {
      ensureVisible([root, ...items]);
      return undefined;
    }
    let tl;
    try {
      utils.set(items, { opacity: 0, translateY: 10 });
      utils.set(root, { scale: 0.96, opacity: 0 });
      const drawables = svg.createDrawable([circle, tick]);
      tl = createTimeline({ defaults: { ease: 'outExpo' } })
        .add(root, { opacity: [0, 1], scale: [0.96, 1], duration: 500 })
        .add(drawables[0], { draw: ['0 0', '0 1'], duration: 700, ease: 'inOutQuad' }, '-=300')
        .add(drawables[1], { draw: ['0 0', '0 1'], duration: 450, ease: 'outQuad' }, '-=250')
        .add(root.querySelector('[data-icon]'), { scale: [1, 1.12, 1], duration: 500, ease: 'outBack(2)' }, '-=200')
        .add(items, { opacity: [0, 1], translateY: [10, 0], duration: 600, delay: stagger(90) }, '-=400');
    } catch {
      ensureVisible([root, ...items]);
      if (circle) circle.style.strokeDasharray = 'none';
      if (tick) tick.style.strokeDasharray = 'none';
    }
    const safety = setTimeout(() => ensureVisible([root, ...items]), 3000);
    return () => {
      clearTimeout(safety);
      tl?.revert?.();
      ensureVisible([root, ...items]);
    };
  }, []);

  return (
    <div ref={ref} className={styles.success} role="status" aria-live="polite">
      <span className={styles.successIcon} data-icon>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <circle data-draw-circle cx="36" cy="36" r="31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path data-draw-tick d="M22 37.5 31.5 47 50 27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className={styles.successTitle} data-success-item>
        Message sent — thanks!
      </h3>
      <p className={styles.successText} data-success-item>
        Your note is on its way. You’ll get a reply at the email you provided, usually within a day or two.
      </p>
      <div data-success-item>
        <Button variant="secondary" onClick={onReset}>
          <MessageSquareText size={16} aria-hidden="true" /> Send another message
        </Button>
      </div>
    </div>
  );
}

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState(null);
  const cardRef = useRef(null);

  const errors = validate(values);
  const showError = (field) => (touched[field] ? errors[field] : undefined);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (serverError) setServerError(null);
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const shake = () => {
    const el = cardRef.current;
    if (!el || prefersReducedMotion()) return;
    try {
      animate(el, { translateX: [0, -8, 8, -5, 5, 0], duration: 420, ease: 'inOutQuad' });
    } catch {
      /* ignore */
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(errors).length) {
      shake();
      const first = Object.keys(errors)[0];
      e.currentTarget.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await contactApi.send({ name: values.name.trim(), email: values.email.trim(), message: values.message.trim() });
      setSent(true);
      setValues(EMPTY);
      setTouched({});
      toast.success('Message sent — thanks for reaching out!');
    } catch (err) {
      const msg =
        err?.status === 429
          ? 'Too many messages in a short time — please try again in a few minutes.'
          : err?.message || 'Could not send your message. Please try again.';
      setServerError(msg);
      toast.error(msg);
      shake();
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = LIMITS.message - values.message.length;

  return (
    <div ref={cardRef} className={styles.card}>
      {sent ? (
        <SuccessPanel onReset={() => setSent(false)} />
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.row}>
            <Input
              label="Your name"
              name="name"
              icon={User}
              placeholder="Jane Doe"
              autoComplete="name"
              maxLength={LIMITS.name}
              value={values.name}
              onChange={onChange}
              onBlur={onBlur}
              error={showError('name')}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={onChange}
              onBlur={onBlur}
              error={showError('email')}
              required
            />
          </div>
          <TextArea
            label="Message"
            name="message"
            placeholder="What’s on your mind? Bugs, ideas, a match you’d like covered…"
            rows={6}
            maxLength={LIMITS.message}
            value={values.message}
            onChange={onChange}
            onBlur={onBlur}
            error={showError('message')}
            hint={remaining < 200 ? `${remaining} characters left` : undefined}
            required
          />
          {serverError && (
            <p className={styles.serverError} role="alert">
              {serverError}
            </p>
          )}
          <div className={styles.footer}>
            <span className={styles.note}>
              <CheckCircle2 size={14} aria-hidden="true" /> No spam, no newsletters — just a reply.
            </span>
            <Button type="submit" variant="gradient" loading={submitting} className={styles.submit}>
              {!submitting && <Send size={16} aria-hidden="true" />}
              {submitting ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
