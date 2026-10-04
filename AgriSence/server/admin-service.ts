import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function app() {
  const existing = getApps().find((item) => item.name === 'portal-server');
  if (existing) return existing;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'agrisence-dd735';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!json && !(clientEmail && privateKey) && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Portal server needs FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
  }
  const serviceAccount = json ? JSON.parse(json) as Record<string, string> : null;
  return initializeApp({
    credential: serviceAccount
      ? cert({ projectId: serviceAccount.projectId || serviceAccount.project_id, clientEmail: serviceAccount.clientEmail || serviceAccount.client_email, privateKey: (serviceAccount.privateKey || serviceAccount.private_key || '').replace(/\\n/g, '\n') })
      : clientEmail && privateKey
        ? cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') })
        : applicationDefault(),
    projectId,
  }, 'portal-server');
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
