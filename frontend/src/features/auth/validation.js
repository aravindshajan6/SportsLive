// Client-side validation helpers shared by the auth + profile forms.
// Rules mirror the backend zod schemas (see SPEC §Auth).

export const USERNAME_RULE = '3–24 characters · letters, numbers and underscores';
export const PASSWORD_MIN = 6;

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateUsername(value = '') {
  const v = value.trim();
  if (!v) return 'Username is required';
  if (v.length < 3) return 'Username must be at least 3 characters';
  if (v.length > 24) return 'Username must be at most 24 characters';
  if (!USERNAME_RE.test(v)) return 'Only letters, numbers and underscores';
  return null;
}

export function validateEmail(value = '') {
  const v = value.trim();
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value = '', { label = 'Password' } = {}) {
  if (!value) return `${label} is required`;
  if (value.length < PASSWORD_MIN) return `${label} must be at least ${PASSWORD_MIN} characters`;
  if (value.length > 72) return `${label} must be at most 72 characters`;
  return null;
}

export function validateConfirm(password = '', confirm = '') {
  if (!confirm) return 'Please confirm your password';
  if (confirm !== password) return 'Passwords do not match';
  return null;
}

/** 0 (empty) … 4 (strong). */
export function passwordStrength(pw = '') {
  if (!pw) return { score: 0, label: '', hint: `At least ${PASSWORD_MIN} characters` };
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  score = Math.min(4, score);
  if (pw.length < PASSWORD_MIN) score = Math.min(score, 1);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const hints = [
    '',
    `Use at least ${PASSWORD_MIN} characters`,
    'Add numbers or capital letters',
    'Add a symbol to make it stronger',
    'Great password',
  ];
  return { score, label: labels[score], hint: hints[score] };
}

/** Only allow same-origin absolute paths for `?next=` redirects. */
export function safeNext(raw, fallback = '/profile') {
  if (!raw) return fallback;
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  if (/^\/(login|signup)(\?|#|$)/.test(path)) return fallback;
  return path;
}

/** Map an API error onto form fields. Returns { field?: message, form?: message }. */
export function mapServerError(err, fieldMap = {}) {
  const out = {};
  const code = err?.code;
  if (code && fieldMap[code]) {
    out[fieldMap[code]] = err.message;
    return out;
  }
  const fieldErrors = err?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    let mapped = false;
    Object.entries(fieldErrors).forEach(([field, msgs]) => {
      const msg = Array.isArray(msgs) ? msgs[0] : msgs;
      if (msg) {
        out[field] = String(msg);
        mapped = true;
      }
    });
    if (mapped) return out;
  }
  out.form = err?.message || 'Something went wrong. Please try again.';
  return out;
}
