import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'eduquiz_admin';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET?.length >= 32);
}

export function verifyAdminPassword(password) {
  if (!isAdminConfigured() || typeof password !== 'string') return false;
  const expected = createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
  const actual = createHash('sha256').update(password).digest();
  return timingSafeEqual(actual, expected);
}

function sign(expiresAt) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(String(expiresAt)).digest('hex');
}

export function createAdminCookie() {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const value = `${expiresAt}.${sign(expiresAt)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearAdminCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function isAdminAuthenticated(req) {
  if (!isAdminConfigured()) return false;
  const cookie = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;

  const value = cookie.slice(COOKIE_NAME.length + 1);
  const separator = value.indexOf('.');
  if (separator < 1) return false;

  const expiresAt = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!/^\d{13}$/.test(expiresAt) || !/^[a-f0-9]{64}$/.test(signature) || Number(expiresAt) <= Date.now()) return false;

  const expected = Buffer.from(sign(expiresAt), 'hex');
  const actual = Buffer.from(signature, 'hex');
  return timingSafeEqual(actual, expected);
}