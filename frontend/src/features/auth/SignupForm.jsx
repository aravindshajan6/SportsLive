import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AtSign, Check, Sparkles, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext.jsx';
import { Input } from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import PasswordInput from './PasswordInput.jsx';
import PasswordStrength from './PasswordStrength.jsx';
import { USERNAME_RULE, mapServerError, validateConfirm, validateEmail, validatePassword, validateUsername } from './validation.js';
import styles from './Forms.module.css';

const FIELD_CODES = { USERNAME_TAKEN: 'username', EMAIL_TAKEN: 'email' };
const ORDER = ['username', 'email', 'password', 'confirm'];

function validate(values) {
  const errors = {};
  const u = validateUsername(values.username);
  if (u) errors.username = u;
  const e = validateEmail(values.email);
  if (e) errors.email = e;
  const p = validatePassword(values.password);
  if (p) errors.password = p;
  const c = validateConfirm(values.password, values.confirm);
  if (c) errors.confirm = c;
  return errors;
}

/**
 * @param {{ next: string, onSwitch: () => void, onError?: () => void }} props
 */
export default function SignupForm({ next, onSwitch, onError }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const formRef = useRef(null);
  const focusField = (name) => formRef.current?.elements.namedItem(name)?.focus();

  const errors = validate(values);
  const shown = (name) => serverErrors[name] || (submitted || touched[name] ? errors[name] : undefined);
  // live feedback: the confirm field and username validate as you type once non-empty
  const liveShown = (name) => serverErrors[name] || (values[name] || submitted || touched[name] ? errors[name] : undefined);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (serverErrors[name] || serverErrors.form) {
      setServerErrors((s) => {
        const { [name]: _drop, form: _form, ...rest } = s;
        return rest;
      });
    }
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const firstInvalid = ORDER.find((k) => errors[k]);
    if (firstInvalid) {
      focusField(firstInvalid);
      onError?.();
      return;
    }
    setSubmitting(true);
    setServerErrors({});
    try {
      const user = await signup({
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast.success(`Account created — welcome, ${user.username}!`);
      navigate(next, { replace: true });
    } catch (err) {
      const mapped = mapServerError(err, FIELD_CODES);
      setServerErrors(mapped);
      setSubmitting(false);
      onError?.();
      const field = ORDER.find((k) => mapped[k]);
      if (field) focusField(field);
    }
  };

  const usernameOk = !errors.username && values.username;

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-busy={submitting}>
      <div className={styles.head}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Join the stands — it only takes a minute.</p>
      </div>

      {serverErrors.form && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} />
          <span>{serverErrors.form}</span>
        </div>
      )}

      <Input
        label="Username"
        name="username"
        icon={User}
        value={values.username}
        onChange={onChange}
        onBlur={onBlur}
        error={liveShown('username')}
        hint={
          usernameOk ? (
            <span className={styles.success}>
              <Check size={12} /> Looks good
            </span>
          ) : (
            USERNAME_RULE
          )
        }
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={24}
        placeholder="e.g. striker_9"
        disabled={submitting}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        icon={AtSign}
        value={values.email}
        onChange={onChange}
        onBlur={onBlur}
        error={shown('email')}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="email"
        placeholder="you@example.com"
        disabled={submitting}
        required
      />
      <PasswordInput
        label="Password"
        name="password"
        value={values.password}
        onChange={onChange}
        onBlur={onBlur}
        error={shown('password')}
        autoComplete="new-password"
        placeholder="At least 6 characters"
        aria-describedby="signup-strength"
        disabled={submitting}
        required
      />
      <PasswordStrength value={values.password} id="signup-strength" />
      <PasswordInput
        label="Confirm password"
        name="confirm"
        value={values.confirm}
        onChange={onChange}
        onBlur={onBlur}
        error={liveShown('confirm')}
        hint={values.confirm && !errors.confirm ? <span className={styles.success}><Check size={12} /> Passwords match</span> : undefined}
        autoComplete="new-password"
        placeholder="Repeat your password"
        disabled={submitting}
        required
      />

      <div className={styles.actions}>
        <Button type="submit" variant="gradient" size="lg" block loading={submitting} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
          {!submitting && <Sparkles size={18} />}
        </Button>
        <p className={styles.switch}>
          Already have an account?{' '}
          <button type="button" className={styles.switchBtn} onClick={onSwitch} disabled={submitting}>
            Log in
          </button>
        </p>
      </div>
    </form>
  );
}
