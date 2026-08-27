import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext.jsx';
import { Input } from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import PasswordInput from './PasswordInput.jsx';
import styles from './Forms.module.css';

function validate(values) {
  const errors = {};
  if (!values.identifier.trim()) errors.identifier = 'Enter your username or email';
  if (!values.password) errors.password = 'Enter your password';
  return errors;
}

/**
 * @param {{ next: string, onSwitch: () => void, onError?: () => void }} props
 */
export default function LoginForm({ next, onSwitch, onError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ identifier: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  const errors = validate(values);
  const shown = (name) => (submitted || touched[name] ? errors[name] : undefined);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (serverError) setServerError(null);
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      (errors.identifier ? identifierRef : passwordRef).current?.focus();
      onError?.();
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const user = await login({ identifier: values.identifier.trim(), password: values.password });
      toast.success(`Welcome back, ${user.username}!`);
      navigate(next, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
      setSubmitting(false);
      onError?.();
      passwordRef.current?.focus();
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={submitting}>
      <div className={styles.head}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to comment on matches and manage your profile.</p>
      </div>

      {serverError && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <Input
        ref={identifierRef}
        label="Username or email"
        name="identifier"
        icon={User}
        value={values.identifier}
        onChange={onChange}
        onBlur={onBlur}
        error={shown('identifier')}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="e.g. striker_9"
        disabled={submitting}
        required
      />
      <PasswordInput
        ref={passwordRef}
        label="Password"
        name="password"
        value={values.password}
        onChange={onChange}
        onBlur={onBlur}
        error={shown('password')}
        autoComplete="current-password"
        placeholder="Your password"
        disabled={submitting}
        required
      />

      <div className={styles.actions}>
        <Button type="submit" variant="gradient" size="lg" block loading={submitting} disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
          {!submitting && <ArrowRight size={18} />}
        </Button>
        <p className={styles.switch}>
          New to SportsLive?{' '}
          <button type="button" className={styles.switchBtn} onClick={onSwitch} disabled={submitting}>
            Create account
          </button>
        </p>
      </div>
    </form>
  );
}
