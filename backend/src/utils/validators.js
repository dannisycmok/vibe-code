import { httpError, validationError } from './http-error.js';

export function parseId(value, label = 'id') {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw httpError(400, `${label} must be a positive integer.`);
  }

  return id;
}

export function readString(value, {
  field = 'value',
  required = false,
  min = 1,
  max = 255,
  allowEmpty = false,
  trim = true,
  errors,
} = {}) {
  if (value === undefined || value === null) {
    if (required) errors[field] = `${field} is required.`;
    return undefined;
  }

  if (typeof value !== 'string') {
    errors[field] = `${field} must be a string.`;
    return undefined;
  }

  const cleaned = trim ? value.trim() : value;

  if (!allowEmpty && cleaned.length < min) {
    errors[field] = min <= 1
      ? `${field} is required.`
      : `${field} must be at least ${min} characters.`;
    return undefined;
  }

  if (cleaned.length > max) {
    errors[field] = `${field} must be at most ${max} characters.`;
    return undefined;
  }

  return cleaned;
}

export function readNumber(value, {
  field = 'value',
  required = false,
  min = -Infinity,
  max = Infinity,
  integer = false,
  errors,
} = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) errors[field] = `${field} is required.`;
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    errors[field] = `${field} must be a valid number.`;
    return undefined;
  }

  if (integer && !Number.isInteger(parsed)) {
    errors[field] = `${field} must be a whole number.`;
    return undefined;
  }

  if (parsed < min) {
    errors[field] = `${field} must be at least ${min}.`;
    return undefined;
  }

  if (parsed > max) {
    errors[field] = `${field} must be at most ${max}.`;
    return undefined;
  }

  return parsed;
}

export function readEmail(value, { field = 'email', required = false, errors } = {}) {
  const email = readString(value, {
    field,
    required,
    max: 160,
    errors,
  });

  if (email === undefined) return undefined;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    errors[field] = 'email must be a valid email address.';
    return undefined;
  }

  return email.toLowerCase();
}

export function readDate(value, { field = 'order_date', errors } = {}) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    errors[field] = `${field} must be a valid date.`;
    return undefined;
  }

  return date.toISOString();
}

export function assertNoErrors(errors) {
  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }
}
