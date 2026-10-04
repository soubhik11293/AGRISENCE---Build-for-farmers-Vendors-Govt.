import type { Request, Response } from 'express';
import { diagnosePest } from '../server/pest-service.js';
import { publicAiError } from '../server/gemini.js';
import { enforceRateLimit } from '../server/request-guard.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.setHeader('Allow', 'POST').status(405).json({ error: 'Method not allowed.' });
  if (!enforceRateLimit(req, res, 'pest', 10)) return;
  res.setHeader('Cache-Control', 'no-store');
  try {
    return res.json(await diagnosePest(req.body || {}));
  } catch (error) {
    const failure = publicAiError(error);
    return res.status(failure.status).json({ error: failure.message, code: failure.code });
  }
}
