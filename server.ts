import express, { type Request, type Response } from 'express';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import * as path from 'node:path';
import { randomInt, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirestore,
  type DocumentData,
  type DocumentReference
} from 'firebase-admin/firestore';
import type { CartItem, Order, Product, PromoCode } from './src/types';
import { calculateDeliveryFee } from './src/utils/currency';
import { validateOrderRequest } from './src/services/orderValidation';

const PROJECT_ID = 'zstore-7ed88';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const ADMIN_SESSION_COOKIE = 'zstore_admin_session';
const app = express();
const existingAdminApp = getApps().find(firebaseApp => firebaseApp.name === 'zstore-api');
if (existingAdminApp && existingAdminApp.options.projectId !== PROJECT_ID) {
  throw new Error('Existing Firebase Admin app is not configured for zstore-7ed88.');
}
const adminApp = existingAdminApp || initializeApp(
    { credential: applicationDefault(), projectId: PROJECT_ID },
    'zstore-api'
  );
const adminAuth = getAuth(adminApp);
const firestore = getFirestore(adminApp);

app.use(express.json({ limit: '64kb' }));

interface AdminSession {
  uid: string;
  email: string;
  expiresAt: number;
}

interface LoginRateLimit {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const adminSessions = new Map<string, AdminSession>();
const adminLoginAttempts = new Map<string, LoginRateLimit>();

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!email || !passwordHash || !sessionSecret) {
    throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD_HASH et ADMIN_SESSION_SECRET doivent être configurés côté serveur.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash) ||
      sessionSecret.length < 32) {
    throw new Error('La configuration d’authentification administrateur est invalide.');
  }
  return { email, passwordHash, sessionSecret };
}

function getClientAddress(req: Request): string {
  return req.socket.remoteAddress || 'unknown';
}

function recordAdminLoginFailure(key: string): void {
  const now = Date.now();
  const previous = adminLoginAttempts.get(key);
  const entry = !previous || now - previous.firstAttemptAt > ADMIN_LOGIN_WINDOW_MS
    ? { attempts: 0, firstAttemptAt: now, lockedUntil: 0 }
    : previous;
  entry.attempts += 1;
  if (entry.attempts >= ADMIN_LOGIN_MAX_ATTEMPTS) {
    entry.lockedUntil = now + ADMIN_LOGIN_WINDOW_MS;
  }
  adminLoginAttempts.set(key, entry);
}

function setAdminSessionCookie(res: Response, value: string, maxAgeMs: number): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`
  );
}

function readAdminSession(req: Request): AdminSession | null {
  try {
    const cookie = req.headers.cookie?.split(';')
      .map(value => value.trim())
      .find(value => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));
    if (!cookie) return null;
    const token = cookie.slice(ADMIN_SESSION_COOKIE.length + 1);
    const separator = token.indexOf('.');
    if (separator <= 0) return null;
    const sessionId = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    const { sessionSecret } = getAdminConfig();
    const expected = createHmac('sha256', sessionSecret).update(sessionId).digest();
    const actual = Buffer.from(signature, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const session = adminSessions.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      adminSessions.delete(sessionId);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

app.post('/api/admin/login', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || email.length > 254 || !password || password.length > 1024) {
    return res.status(400).json({ message: 'Adresse e-mail et mot de passe requis.' });
  }

  let config: ReturnType<typeof getAdminConfig>;
  try {
    config = getAdminConfig();
  } catch (error) {
    console.error('Admin authentication configuration error:', error);
    return res.status(503).json({ message: 'L’authentification administrateur n’est pas configurée sur le serveur.' });
  }

  const rateLimitKey = `${getClientAddress(req)}:${email}`;
  const rateLimit = adminLoginAttempts.get(rateLimitKey);
  if (rateLimit?.lockedUntil && rateLimit.lockedUntil > Date.now()) {
    return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }
  if (rateLimit && Date.now() - rateLimit.firstAttemptAt > ADMIN_LOGIN_WINDOW_MS) {
    adminLoginAttempts.delete(rateLimitKey);
  }

  let passwordMatches = false;
  try {
    passwordMatches = await bcrypt.compare(password, config.passwordHash);
  } catch (error) {
    console.error('Admin bcrypt verification failed:', error);
    return res.status(503).json({ message: 'La configuration d’authentification administrateur est invalide.' });
  }

  if (email !== config.email || !passwordMatches) {
    recordAdminLoginFailure(rateLimitKey);
    return res.status(401).json({ message: 'Identifiants administrateur invalides.' });
  }

  try {
    const user = await adminAuth.getUserByEmail(config.email);
    if (user.disabled || !user.emailVerified) {
      return res.status(403).json({
        message: 'Le compte administrateur Firebase doit être actif et son adresse e-mail vérifiée.'
      });
    }

    const customToken = await adminAuth.createCustomToken(user.uid, { admin: true });
    const sessionId = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
    const signature = createHmac('sha256', config.sessionSecret).update(sessionId).digest('hex');
    adminSessions.set(sessionId, { uid: user.uid, email: config.email, expiresAt });
    adminLoginAttempts.delete(rateLimitKey);
    setAdminSessionCookie(res, `${sessionId}.${signature}`, ADMIN_SESSION_TTL_MS);
    return res.status(200).json({ success: true, customToken, expiresAt });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code === 'auth/user-not-found') {
      return res.status(409).json({
        message: 'Le compte doit d’abord être créé dans Firebase Authentication; aucun compte n’a été créé automatiquement.'
      });
    }
    console.error('Admin account lookup or custom token creation failed:', error);
    return res.status(503).json({ message: 'Le service Firebase Authentication est temporairement indisponible.' });
  }
});

app.get('/api/admin/session', (req: Request, res: Response) => {
  const session = readAdminSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  return res.status(200).json({
    authenticated: true,
    admin: { uid: session.uid, email: session.email },
    expiresAt: session.expiresAt
  });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const session = readAdminSession(req);
  if (session) {
    const cookie = req.headers.cookie?.split(';')
      .map(value => value.trim())
      .find(value => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));
    const token = cookie?.slice(ADMIN_SESSION_COOKIE.length + 1);
    const sessionId = token?.split('.')[0];
    if (sessionId) adminSessions.delete(sessionId);
  }
  setAdminSessionCookie(res, '', 0);
  return res.status(200).json({ success: true });
});

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key =>
      `${JSON.stringify(key)}:${stableStringify(record[key])}`
    ).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

function matchesExistingOrder(
  existing: Record<string, unknown>,
  request: ReturnType<typeof validateOrderRequest>,
  userId: string
): boolean {
  const existingItems = existing.items;
  if (!Array.isArray(existingItems)) return false;
  const savedItems = existingItems.map(value => {
    if (!value || typeof value !== 'object') return null;
    const item = value as Record<string, unknown>;
    const product = item.product as Record<string, unknown> | undefined;
    return {
      productId: product?.id,
      quantity: item.quantity,
      ...(item.selectedColor === undefined ? {} : { selectedColor: item.selectedColor }),
      ...(item.selectedSize === undefined ? {} : { selectedSize: item.selectedSize })
    };
  });
  const normalizedRequest = request.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    ...(item.selectedColor === undefined ? {} : { selectedColor: item.selectedColor }),
    ...(item.selectedSize === undefined ? {} : { selectedSize: item.selectedSize })
  }));

  return existing.userId === userId &&
    stableStringify(savedItems) === stableStringify(normalizedRequest) &&
    stableStringify(existing.deliveryDetails) === stableStringify(request.deliveryDetails) &&
    existing.paymentMethod === request.paymentMethod &&
    existing.appliedPromo === request.promoCode;
}

app.post('/api/orders', async (req: Request, res: Response) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise pour valider la commande.' });
  }

  let userId: string;
  try {
    const token = authorization.slice('Bearer '.length);
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    userId = decodedToken.uid;
  } catch (error) {
    console.error('Firebase ID token verification failed:', error);
    const code = error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
    if (code === 'app/invalid-credential' || code === 'auth/insufficient-permission') {
      return res.status(503).json({ error: 'Le serveur Firebase Admin ne dispose pas des autorisations nécessaires.' });
    }
    return res.status(401).json({ error: 'Session Firebase invalide ou expirée.' });
  }

  let orderRequest: ReturnType<typeof validateOrderRequest>;
  try {
    orderRequest = validateOrderRequest(req.body);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Données de commande invalides.'
    });
  }

  const orderId = `ord-${createHash('sha256')
    .update(`${userId}:${orderRequest.idempotencyKey}`)
    .digest('hex')}`;
  const orderRef = firestore.collection('orders').doc(orderId);
  const nowIso = new Date().toISOString();

  try {
    const order = await firestore.