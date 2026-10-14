const TECHNICAL_ERROR_PATTERNS = [
  /unexpected (token|string|number|identifier|end of json)/i,
  /json\.parse|is not valid json/i,
  /is not a function/i,
  /cannot read propert/i,
  /undefined is not/i,
  /null is not/i,
  /syntaxerror|typeerror|referenceerror/i,
  /^\s*at\s+\S+\s*\(/m, // stack trace lines
  /\.(js|ts|jsx|tsx):\d+:\d+/, // file:line:col references
  /status code \d{3}/i,
  /expected .+ received/i, // raw zod type-mismatch messages
  /econnrefused|etimedout|enotfound/i,
];

const FIREBASE_AUTH_MESSAGES = {
  'auth/invalid-verification-code': 'That code didn’t match. Please check it and try again.',
  'auth/code-expired': 'That code has expired. Please request a new one.',
  'auth/missing-verification-code': 'Please enter the 6-digit code.',
  'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
  'auth/quota-exceeded': 'We couldn’t send the code right now. Please try again later.',
  'auth/invalid-phone-number': 'Please enter a valid 10-digit mobile number.',
  'auth/network-request-failed': 'We couldn’t reach the server. Please check your internet connection and try again.',
};

export const getFriendlyErrorMessage = (
  err,
  fallback = 'Something went wrong on our end. Please try again in a moment.'
) => {
  // Firebase Auth errors carry a stable `code`; their raw messages
  // ("Firebase: Error (auth/...)") aren't meant for users.
  if (typeof err?.code === 'string' && err.code.startsWith('auth/')) {
    return FIREBASE_AUTH_MESSAGES[err.code] || fallback;
  }

  const data = err?.response?.data;
  const raw =
    (typeof err === 'string' ? err : '') ||
    (data?.message === 'Validation failed' && data?.errors?.[0]?.msg) ||
    data?.message ||
    err?.message ||
    '';

  if (!raw) return fallback;

  if (/network error|failed to fetch/i.test(raw)) {
    return 'We couldn’t reach the server. Please check your internet connection and try again.';
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw))) {
    return fallback;
  }

  // Long, unpunctuated or code-like strings are unlikely to be meant for users
  if (raw.length > 160 || /[{}<>]/.test(raw)) {
    return fallback;
  }

  return raw;
};
