import type { Request, Response } from 'express';
import { actorForToken, portalAction, publicPortalAction } from '../server/portal-service.js';
import { PortalError } from '../server/portal-policy.js';
import { enforceRateLimit } from '../server/request-guard.js';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.setHeader('Allow', 'POST').status(405).json({ error: 'Method not allowed.' });
  try {
    const action = req.body?.action;
    if (typeof action !== 'string') throw new PortalError(400, 'An action is required.');
    if (action === 'login' || action === 'registerVendor') {
      if (!enforceRateLimit(req, res, 'portal-auth', 15)) return;
      return res.json(await publicPortalAction(action, req.body));
    }
    const bearer = req.headers.authorization;
    if (!bearer?.startsWith('Bearer ')) throw new PortalError(401, 'Sign in first.');
    const actor = await actorForToken(bearer.slice(7));
    return res.json(await portalAction(actor, action, req.body));
  } catch (error: any) {
    if (error instanceof PortalError) return res.status(error.status).json({ error: error.message });
    if (error.code === 'auth/email-already-exists') return res.status(409).json({ error: 'This portal account already exists. Sign in instead.' });
    console.error('Portal request failed:', error.code || error.message);
    return res.status(503).json({ error: 'Portal service unavailable. Check the server Firebase credentials and try again.' });
  }
}
