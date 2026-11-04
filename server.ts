import express, { type Request, type Response } from 'express';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import * as path from 'node:path';
import { randomInt, createHash } from 'node:crypto';
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
import {
  validateAdminAuthConfig,
  verifyAdminPassword
} from './src/services/adminAuthSecurity';

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

interface LoginRateLimit {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const adminLoginAttempts = new Map<string, LoginRateLimit>();

function getAdminConfig() {
  return validateAdminAuthConfig(
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD_HASH
  );
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

function getAdminSessionCookie(req: Request): string | null {
  const cookie = req.headers.cookie?.split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return cookie?.slice(ADMIN_SESSION_COOKIE.length + 1) || null;
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

  const rateLimitKey = config.email;
  const rateLimit = adminLoginAttempts.get(rateLimitKey);
  if (rateLimit?.lockedUntil && rateLimit.lockedUntil > Date.now()) {
    return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }
  if (rateLimit && Date.now() - rateLimit.firstAttemptAt > ADMIN_LOGIN_WINDOW_MS) {
    adminLoginAttempts.delete(rateLimitKey);
  }

  let credentialsValid = false;
  try {
    credentialsValid = await verifyAdminPassword(
      email,
      password,
      config.email,
      config.passwordHash
    );
  } catch (error) {
    console.error('Admin bcrypt verification failed:', error);
    return res.status(503).json({ message: 'La configuration d’authentification administrateur est invalide.' });
  }

  if (!credentialsValid) {
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
    adminLoginAttempts.delete(rateLimitKey);
    return res.status(200).json({ success: true, customToken });
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

app.post('/api/admin/session', async (req: Request, res: Response) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Jeton Firebase requis.' });
  }
  try {
    const idToken = authorization.slice('Bearer '.length);
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (decoded.admin !== true) {
      return res.status(403).json({ message: 'Le jeton Firebase ne possède pas le rôle administrateur.' });
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: ADMIN_SESSION_TTL_MS
    });
    setAdminSessionCookie(res, sessionCookie, ADMIN_SESSION_TTL_MS);
    return res.status(200).json({
      success: true,
      expiresAt: Date.now() + ADMIN_SESSION_TTL_MS
    });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (['auth/argument-error', 'auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked'].includes(code)) {
      return res.status(401).json({ message: 'Le jeton Firebase est invalide ou expiré.' });
    }
    console.error('Admin session creation failed:', error);
    return res.status(503).json({ message: 'La session administrateur ne peut pas être créée pour le moment.' });
  }
});

app.get('/api/admin/session', async (req: Request, res: Response) => {
  const sessionCookie = getAdminSessionCookie(req);
  if (!sessionCookie) return res.status(401).json({ authenticated: false });
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.admin !== true) return res.status(403).json({ authenticated: false });
    return res.status(200).json({
      authenticated: true,
      admin: { uid: decoded.uid, email: decoded.email || null },
      expiresAt: decoded.exp * 1000
    });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if ([
      'auth/argument-error',
      'auth/invalid-session-cookie',
      'auth/session-cookie-expired',
      'auth/session-cookie-revoked',
      'auth/id-token-revoked',
      'auth/user-disabled',
      'auth/user-not-found'
    ].includes(code)) {
      return res.status(401).json({ authenticated: false });
    }
    console.error('Admin session verification failed:', error);
    return res.status(503).json({ authenticated: false, message: 'La session administrateur ne peut pas être vérifiée.' });
  }
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
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
    const order = await firestore.runTransaction(async transaction => {
      const priorOrder = await transaction.get(orderRef);
      if (priorOrder.exists) {
        const existing = priorOrder.data() as Record<string, unknown>;
        if (
          existing.userId !== userId ||
          !matchesExistingOrder(existing, orderRequest, userId)
        ) {
          const error = new Error('Cette clé de commande a déjà été utilisée pour un autre panier.');
          error.name = 'IdempotencyConflict';
          throw error;
        }
        return { ...(existing as unknown as Omit<Order, 'id'>), id: priorOrder.id };
      }

      const requestedQuantities = new Map<string, number>();
      for (const item of orderRequest.items) {
        requestedQuantities.set(
          item.productId,
          (requestedQuantities.get(item.productId) || 0) + item.quantity
        );
      }

      const productRecords: Array<{
        ref: DocumentReference;
        data: DocumentData;
        quantity: number;
      }> = [];
      let subtotal = 0;

      for (const [productId, quantity] of requestedQuantities) {
        const productRef = firestore.collection('products').doc(productId);
        const productSnapshot = await transaction.get(productRef);
        if (!productSnapshot.exists) {
          throw new Error(`Le produit ${productId} n’existe plus en boutique.`);
        }
        const productData = productSnapshot.data();
        if (
          !productData ||
          typeof productData.price !== 'number' ||
          !Number.isFinite(productData.price) ||
          productData.price < 0 ||
          !Number.isSafeInteger(productData.stock) ||
          productData.stock < quantity
        ) {
          throw new Error(`Stock insuffisant ou données invalides pour "${productData?.name || productId}".`);
        }
        subtotal += productData.price * quantity;
        if (!Number.isFinite(subtotal)) {
          throw new Error('Le montant de la commande dépasse la limite autorisée.');
        }
        productRecords.push({ ref: productRef, data: productData, quantity });
      }

      const promoSnapshot = orderRequest.promoCode
        ? await transaction.get(firestore.collection('promos').doc(orderRequest.promoCode))
        : null;
      let appliedPromo: PromoCode | undefined;
      let discount = 0;
      if (orderRequest.promoCode) {
        if (!promoSnapshot?.exists) throw new Error('Ce code promotionnel n’est plus disponible.');
        const promoData = promoSnapshot.data() as PromoCode;
        if (promoData.code !== orderRequest.promoCode || promoData.isActive !== true) {
          throw new Error('Ce code promotionnel n’est plus actif.');
        }
        if (
          typeof promoData.minOrderAmount === 'number' &&
          subtotal < promoData.minOrderAmount
        ) {
          throw new Error(`Le panier minimum pour ce code est de ${promoData.minOrderAmount.toLocaleString()} FCFA.`);
        }
        if (
          promoData.discountPercent !== undefined &&
          (!Number.isFinite(promoData.discountPercent) || promoData.discountPercent < 0 || promoData.discountPercent > 100)
        ) {
          throw new Error('La configuration de cette promotion est invalide.');
        }
        if (
          promoData.discountAmount !== undefined &&
          (!Number.isFinite(promoData.discountAmount) || promoData.discountAmount < 0)
        ) {
          throw new Error('La configuration de cette promotion est invalide.');
        }
        discount = promoData.discountPercent
          ? Math.round((subtotal * promoData.discountPercent) / 100)
          : promoData.discountAmount || 0;
        appliedPromo = promoData;
      }

      const deliveryFee = calculateDeliveryFee(
        orderRequest.deliveryDetails.city,
        orderRequest.deliveryDetails.deliveryOption,
        subtotal
      );
      const items: CartItem[] = orderRequest.items.map(requestItem => {
        const productRecord = productRecords.find(item => item.ref.id === requestItem.productId);
        if (!productRecord) throw new Error('Données de commande incohérentes.');
        return {
          product: { ...productRecord.data, id: productRecord.ref.id } as Product,
          quantity: requestItem.quantity,
          ...(requestItem.selectedColor === undefined ? {} : { selectedColor: requestItem.selectedColor }),
          ...(requestItem.selectedSize === undefined ? {} : { selectedSize: requestItem.selectedSize })
        };
      });
      const newOrder: Order = {
        id: orderId,
        orderNumber: `ZS-BN-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`,
        date: nowIso,
        userId,
        items,
        subtotal,
        deliveryFee,
        discount,
        ...(appliedPromo ? { appliedPromo: appliedPromo.code } : {}),
        total: Math.max(0, subtotal + deliveryFee - discount),
        deliveryDetails: orderRequest.deliveryDetails,
        status: 'en_attente',
        paymentMethod: orderRequest.paymentMethod,
        isPaid: false,
        timeline: [{
          status: 'en_attente',
          timestamp: new Date(nowIso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
          note: 'Commande enregistrée par le serveur ZStore'
        }]
      };
      if (!Number.isFinite(newOrder.total)) {
        throw new Error('Le montant total de la commande est invalide.');
      }

      for (const record of productRecords) {
        transaction.update(record.ref, {
          stock: record.data.stock - record.quantity,
          updatedAt: nowIso
        });
      }
      transaction.create(orderRef, { ...newOrder, createdAt: nowIso });
      return newOrder;
    });

    return res.status(200).json({ order });
  } catch (error) {
    if (error instanceof Error && error.name === 'IdempotencyConflict') {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof Error && /n’existe plus|Stock insuffisant|promotionnel|panier minimum|configuration|montant/.test(error.message)) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Order transaction failed:', error);
    return res.status(503).json({ error: 'La commande n’a pas pu être enregistrée. Veuillez réessayer.' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`ZStore server listening at http://${HOST}:${PORT} (${isProd ? 'production' : 'development'}).`);
    console.log(`Firebase Admin target: ${PROJECT_ID} / (default).`);
  });
}

startServer().catch(error => {
  console.error('ZStore server startup failed:', error);
  process.exit(1);
});
