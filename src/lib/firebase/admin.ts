import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY in environment variables');
  }

  // If you stored JSON in .env.local, it may include escaped newlines
  const cleaned = raw.replace(/\\n/g, '\n');

  // Some people store it base64-encoded; support both
  try {
    const maybeDecoded = Buffer.from(cleaned, 'base64').toString('utf8');
    return JSON.parse(maybeDecoded);
  } catch {
    return JSON.parse(cleaned);
  }
}

const serviceAccount = parseServiceAccount();

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

export const adminAuth = getAuth(app);
