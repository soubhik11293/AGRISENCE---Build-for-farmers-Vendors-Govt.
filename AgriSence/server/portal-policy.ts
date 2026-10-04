import { createHash } from 'node:crypto';

export class PortalError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function text(value: unknown, label: string, max = 160, optional = false): string {
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.length > max) {
    throw new PortalError(400, `${label} is required and must be at most ${max} characters.`);
  }
  return value.trim();
}
export function number(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > 1e9) {
    throw new PortalError(400, `${label} must be between ${minimum} and 1,000,000,000.`);
  }
  return value;
}
export function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (!values.includes(value as T)) throw new PortalError(400, 'Invalid selection.');
  return value as T;
}
export function password(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128) {
    throw new PortalError(400, 'Use a password of 10–128 characters.');
  }
  return value;
}
export function identifier(role: 'office' | 'vendor', value: unknown) {
  const id = text(value, role === 'office' ? 'Official ID' : 'Email', 254).toLowerCase();
  if (role === 'office' ? !/^[a-z0-9][a-z0-9._-]{2,39}$/.test(id) : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
    throw new PortalError(400, role === 'office' ? 'Use a 3–40 character official ID (letters, digits, dots, underscores or hyphens).' : 'Enter a valid email.');
  }
  return id;
}
// Different Auth identities even when the contact email matches a farmer account.
export function loginEmail(role: 'office' | 'vendor', id: string) {
  return `${createHash('sha256').update(identifier(role, id)).digest('hex')}@${role}.accounts.agrisence.invalid`;
}
export const orderTransitions: Record<string, readonly string[]> = {
  Requested: ['Accepted', 'Cancelled'], Accepted: ['Dispatched', 'Cancelled'],
  Dispatched: ['Completed'], Completed: [], Cancelled: [],
};
export function checkOrderTransition(from: string, to: string) {
  if (!orderTransitions[from]?.includes(to)) throw new PortalError(409, `Cannot change ${from} to ${to}.`);
}
