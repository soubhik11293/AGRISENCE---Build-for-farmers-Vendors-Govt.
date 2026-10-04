import { auth, signInWithCustomToken } from '@/src/lib/firebase';

export type PortalMetrics = {
  farmers: number;
  vendors: number;
  officials: number;
  officeCases: number;
  activeListings: number;
  vendorLeads: number;
  orders: number;
};

async function callPortal<T>(body: Record<string, unknown>, authenticated = true): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (authenticated) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch('/api/portal', { method: 'POST', headers, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Portal request failed.');
  return result as T;
}

export async function portalLogin(role: 'office' | 'vendor', identifier: string, password: string) {
  const result = await callPortal<{ token: string }>({ action: 'login', role, identifier, password }, false);
  await signInWithCustomToken(auth, result.token);
}

export async function registerVendor(input: { identifier: string; password: string; fullName: string; businessName: string; phone: string; location: string }) {
  const result = await callPortal<{ token: string }>({ action: 'registerVendor', ...input }, false);
  await signInWithCustomToken(auth, result.token);
}

export async function callPrivatePortal<T>(action: string, body: Record<string, unknown> = {}) {
  return callPortal<T>({ action, ...body }, true);
}
