export type PortalRole = 'farmer' | 'office' | 'vendor';

export const PORTAL_ROLE_KEY = 'agrisence_active_portal_role';

export function getPortalRole(): PortalRole | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(PORTAL_ROLE_KEY);
  return value === 'farmer' || value === 'office' || value === 'vendor' ? value : null;
}

export function setPortalRole(role: PortalRole) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PORTAL_ROLE_KEY, role);
  window.dispatchEvent(new CustomEvent('agrisence_portal_role_updated', { detail: role }));
}

export function clearPortalRole() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PORTAL_ROLE_KEY);
  window.dispatchEvent(new CustomEvent('agrisence_portal_role_updated', { detail: null }));
}

export const PORTAL_META: Record<PortalRole, {
  label: string;
  shortLabel: string;
  description: string;
  route: string;
  accent: string;
}> = {
  farmer: {
    label: 'Farmer Board',
    shortLabel: 'Farmer Board',
    description: 'Access your farm command center, simulators, pest intelligence, weather, schemes, and mandi tools.',
    route: '/farmer',
    accent: 'emerald',
  },
  office: {
    label: 'Office Login',
    shortLabel: 'Office',
    description: 'Manage farmer cases, approvals, field programs, reports, schemes, and department operations.',
    route: '/office/login',
    accent: 'blue',
  },
  vendor: {
    label: 'Vendor / Broker Login',
    shortLabel: 'Vendor / Broker',
    description: 'Manage mandi offers, input listings, buyer leads, procurement plans, and trade follow-ups.',
    route: '/vendor/login',
    accent: 'amber',
  },
};
