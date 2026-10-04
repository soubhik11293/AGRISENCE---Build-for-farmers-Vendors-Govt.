import { GoogleGenAI, type GenerateContentParameters } from '@google/genai';

export type AiService = 'CHAT' | 'PEST';
export class AiError extends Error {
  constructor(message: string, public status = 502, public code = 'AI_RESPONSE_INVALID') { super(message); }
}

export function serviceConfig(service: AiService) {
  return {
    apiKey: process.env[`GEMINI_${service}_API_KEY`]?.trim() || process.env.GEMINI_API_KEY?.trim(),
    model: process.env[`GEMINI_${service}_MODEL`]?.trim() || 'gemini-3.8-flash',
    fallback: process.env[`GEMINI_${service}_FALLBACK_MODEL`]?.trim() || 'gemini-3.5-flash-lite',
    timeoutMs: service === 'CHAT' ? 18_000 : 24_000,
  };
}

export function parseObject(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch { /* Invalid structured output is retried through the fallback model. */ }
  throw new AiError('The AI returned an incomplete response. Please try again.');
}

function statusOf(error: unknown): number {
  const value = error as { status?: unknown; statusCode?: unknown; code?: unknown };
  return Number(value?.status || value?.statusCode || value?.code) || 0;
}

export function publicAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const status = statusOf(error);
  if (status === 401 || status === 403) return new AiError('The AI service credentials were rejected. Please check the server configuration.', 503, 'AI_CONFIGURATION');
  if (status === 404) return new AiError('The configured Gemini model is unavailable. Please check the model setting.', 503, 'AI_MODEL_UNAVAILABLE');
  if (status === 429) return new AiError('The AI service is busy or its quota is exhausted. Please try again shortly.', 503, 'AI_BUSY');
  if (status >= 500 || status === 408) return new AiError('Gemini is temporarily unavailable. Please try again shortly.', 503, 'AI_UNAVAILABLE');
  return new AiError('Unable to get an AI response. Please try again.', 502, 'AI_REQUEST_FAILED');
}

type Generate = (params: GenerateContentParameters) => Promise<{ text?: string }>;

/** Two bounded attempts; SDK retries are disabled so retries cannot multiply. */
export async function generateStructured<T>(
  service: AiService,
  request: Omit<GenerateContentParameters, 'model'>,
  validate: (value: Record<string, unknown>) => T,
  dependencies: { generate?: Generate; timeoutMs?: number } = {},
): Promise<{ value: T; modelUsed: string }> {
  const config = serviceConfig(service);
  if (!config.apiKey && !dependencies.generate) {
    throw new AiError(`The ${service === 'CHAT' ? 'Guide AI' : 'Pest Vision AI'} service is not configured. Set GEMINI_${service}_API_KEY or GEMINI_API_KEY on the server.`, 503, 'AI_NOT_CONFIGURED');
  }
  const client = dependencies.generate ? null : new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: { timeout: config.timeoutMs, retryOptions: { attempts: 1 }, headers: { 'User-Agent': 'aistudio-build' } },
  });
  const generate = dependencies.generate || ((params) => client!.models.generateContent(params));
  let lastError: unknown;
  for (const model of [config.model, config.fallback]) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    try {
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AiError('The AI request timed out. Please try again.', 504, 'AI_TIMEOUT'));
          controller.abort();
        }, dependencies.timeoutMs ?? config.timeoutMs);
      });
      const response = await Promise.race([
        generate({ ...request, model, config: { ...request.config, responseMimeType: 'application/json', abortSignal: controller.signal } }),
        deadline,
      ]);
      const parsed = parseObject(response.text || '');
      let value: T;
      try { value = validate(parsed); }
      catch { throw new AiError('The AI returned an incomplete response. Please try again.'); }
      return { value, modelUsed: model };
    } catch (error) {
      lastError = error;
      const status = statusOf(error);
      if (!(error instanceof AiError) && ![0, 404, 408, 429, 500, 502, 503, 504].includes(status)) break;
    } finally {
      clearTimeout(timer!);
    }
  }
  throw publicAiError(lastError);
}
