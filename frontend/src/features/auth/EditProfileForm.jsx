import { useRef, useState } from 'react';
import { AlertCircle, AtSign, KeyRound, Save, User, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext.jsx';
import { Input } from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import PasswordInput from './PasswordInput.jsx';
import PasswordStrength from './PasswordStrength.jsx';
import { USERNAME_RULE, mapServerError, validateConfirm, validateEmail, validatePassword, validateUsername } from './validation.js';
import styles from './Forms.module.css';

const FIELD_CODES = { USERNAME_TAKEN: 'username', EMAIL_TAKEN: 'email', INVALID_CURRENT_PASSWORD: 'currentPassword' };
const ORDER = ['username', 'email', 'currentPassword', 'newPassword', 'confirm'];

function initialValues(user) {
  return { username: user.username, email: user.email, currentPassword: '', newPassword: '', confirm: '' };
}

function validate(values) {
  const errors = {};
  const u = validateUsername(values.username);
  if (u) errors.username = u;
  const e = validateEmail(values.email);
  if (e) errors.email = e;
  // the password section only validates when the user is actually changing the password
  if (values.newPassword) {
    if (!values.currentPassword) errors.currentPassword = 'Enter your current password to change it';
    const p = validatePassword(values.newPassword, { label: 'New password' });
    if (p) errors.newPassword = p;
    const c = validateConfirm(values.newPassword, values.confirm);
    if (c) errors.confirm = c;
  }
  return errors;
}

function diff(values, user) {
  const payload = {};
  const username = values.username.trim();
  const email = values.email.trim().toLowerCase();
  if (username !== user.username) payload.username = username;
  if (email !== user.email) payload.email = email;
  if (values.newPassword) {
    payload.currentPassword = values.currentPassword;
    payload.newPassword = values.newPassword;
  }
  return payload;
}

export default function EditProfileForm() {
  const { user, updateProfile } = useAuth();
  const [values, setValues] = useState(() => initialValues(user));
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const formRef = useRef(null);
  const focusField = (name) => formRef.current?.elements.namedItem(name)?.focus();

  const errors = validate(values);
  const payload = diff(values, user);
  const dirty = Object.keys(payload).length > 0;
  const shown = (name) => serverErrors[name] || (submitted || touched[name] ? errors[name] : undefined);
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
    if (!dirty) return;
    const firstInvalid = ORDER.find((k) => errors[k]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    setSubmitting(true);
    setServerErrors({});
    try {
      const updated = await updateProfile(payload);
      const changed = [];
      if (payload.username) changed.push('username');
      if (payload.email) changed.push('email');
      if (payload.newPassword) changed.push('password');
      toast.success(`Profile updated — ${changed.join(', ')} saved.`);
      setValues(initialValues(updated));
      setTouched({});
      setSubmitted(false);
    } catch (err) {
      const mapped = mapServerError(err, FIELD_CODES);
      setServerErrors(mapped);
      const field = ORDER.find((k) => mapped[k]);
      if (field) focusField(field);
    } finally {
      setSubmitting(false);
    }
  };

  const changingPassword = Boolean(values.newPassword);

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-busy={submitting}>
      {serverErrors.form && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} />
          <span>{serverErrors.form}</span>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <UserRound size={16} />
          </span>
          <h3 className={styles.sectionTitle}>Account details</h3>
        </div>
        <Input
          label="Username"
          name="username"
          icon={User}
          value={values.username}
          onChange={onChange}
          onBlur={onBlur}
          error={liveShown('username')}
          hint={USERNAME_RULE}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={24}
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
          disabled={submitting}
          required
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <KeyRound size={16} />
          </span>
          <h3 className={styles.sectionTitle}>Change password</h3>
          <span className={styles.sectionNote}>Optional</span>
        </div>
        <PasswordInput
          label="Current password"
          name="currentPassword"
          value={values.currentPassword}
          onChange={onChange}
          onBlur={onBlur}
          error={shown('currentPassword')}
          autoComplete="current-password"
          placeholder={changingPassword ? 'Required to change password' : 'Needed to change password'}
          disabled={submitting}
        />
        <div className={styles.row2}>
          <PasswordInput
            label="New password"
            name="newPassword"
            value={values.newPassword}
            onChange={onChange}
            onBlur={onBlur}
            error={shown('newPassword')}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            aria-describedby="profile-strength"
            disabled={submitting}
          />
          <PasswordInput
            label="Confirm new password"
            name="confirm"
            value={values.confirm}
            onChange={onChange}
            onBlur={onBlur}
            error={liveShown('confirm')}
            autoComplete="new-password"
            placeholder="Repeat new password"
            disabled={submitting || !changingPassword}
          />
        </div>
        {changingPassword && <PasswordStrength value={values.newPassword} id="profile-strength" />}
      </div>

      <div className={styles.saveRow}>
        <span className={`${styles.dirtyNote} ${dirty ? styles.isDirty : ''}`} aria-live="polite">
          {dirty ? 'You have unsaved changes' : 'No changes yet'}
        </span>
        <Button type="submit" variant="primary" loading={submitting} disabled={!dirty || submitting}>
          {!submitting && <Save size={16} />}
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
