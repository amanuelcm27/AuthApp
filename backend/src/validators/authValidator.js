import { validationError } from '../utils/errorHandler.js';

const MIN_PASSWORD_LENGTH = 8;

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= MIN_PASSWORD_LENGTH
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

export function getPasswordStrength(password) {
  if (typeof password !== 'string') {
    return {
      score: 0,
      label: 'None',
      meetsPolicy: false,
      requirements: []
    };
  }

  const requirements = [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /\d/.test(password) },
    { label: 'One symbol', ok: /[^A-Za-z0-9]/.test(password) }
  ];

  const passed = requirements.filter(item => item.ok).length;
  const score = Math.max(0, Math.min(4, Math.floor((passed / requirements.length) * 4)));
  const label = ['Weak', 'Fair', 'Good', 'Strong', 'Very strong'][Math.min(passed, 4)] ?? 'Weak';

  return {
    score,
    label,
    meetsPolicy: passed === requirements.length,
    requirements
  };
}

export function validateRegistrationInput(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || name.length < 2) {
    throw validationError('Name must be at least 2 characters long', 'name');
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw validationError('Enter a valid email address', 'email');
  }

  const strength = getPasswordStrength(password);
  if (!strength.meetsPolicy) {
    throw validationError(
      'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
      'password',
      'WEAK_PASSWORD'
    );
  }

  return { name, email, password, passwordStrength: strength };
}
