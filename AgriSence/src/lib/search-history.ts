import { savePlatformRecord } from '@/src/lib/platform-sync';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';

export interface SearchHistoryEntry {
  query: string;
  source: 'market' | 'shop' | 'weather' | 'feature';
  category?: string;
  count: number;
  lastSearchedAt: number;
}

const SEARCH_HISTORY_KEY = 'agrisence_search_history';
const MAX_SEARCHES = 30;
const historyKey = () => `${SEARCH_HISTORY_KEY}:${auth.currentUser?.uid || 'guest'}`;

function readHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(historyKey()) || '[]');
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.query === 'string') : [];
  } catch {
    return [];
  }
}

export function getSearchHistory() {
  return readHistory().sort((a, b) => b.lastSearchedAt - a.lastSearchedAt);
}

export function recordSearchHistory(query: string, source: SearchHistoryEntry['source'], category?: string) {
  const normalized = query.trim().replace(/\s+/g, ' ').slice(0, 120);
  if (typeof window === 'undefined' || normalized.length < 2) return;

  const history = readHistory();
  const existing = history.find((entry) => entry.query.toLowerCase() === normalized.toLowerCase() && entry.source === source);
  const entry: SearchHistoryEntry = {
    query: existing?.query || normalized,
    source,
    category: category || existing?.category,
    count: (existing?.count || 0) + 1,
    lastSearchedAt: Date.now(),
  };
  const next = [entry, ...history.filter((item) => item !== existing)].slice(0, MAX_SEARCHES);
  localStorage.setItem(historyKey(), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('agrisence_search_history_updated', { detail: entry }));

  // Keep a cloud copy for authenticated users. Local history remains the
  // immediate source so search suggestions never wait on Firestore.
  void savePlatformRecord('searchHistory', {
    query: entry.query,
    source: entry.source,
    category: entry.category || null,
    searchedAt: new Date(entry.lastSearchedAt).toISOString(),
    count: entry.count,
  }, { source: `search-${source}` }).catch(() => undefined);
}

export function getRecentSearchSuggestions(limit = 6) {
  return getSearchHistory().slice(0, limit).map((entry) => entry.query);
}

export async function syncSearchHistory(userId: string) {
  if (!userId) return getSearchHistory();
  try {
    const snapshot = await getDocs(query(collection(db, 'searchHistory'), where('userId', '==', userId)));
    const cloudEntries: SearchHistoryEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const searchedAt = Date.parse(String(data.searchedAt || data.timestamp || ''));
      return {
        query: String(data.query || '').trim(),
        source: (['market', 'shop', 'weather', 'feature'].includes(String(data.source)) ? String(data.source) : 'shop') as SearchHistoryEntry['source'],
        category: data.category ? String(data.category) : undefined,
        count: Math.max(1, Number(data.count) || 1),
        lastSearchedAt: Number.isFinite(searchedAt) ? searchedAt : Date.now(),
      };
    }).filter((entry) => entry.query.length >= 2);
    const merged = new Map<string, SearchHistoryEntry>();
    [...readHistory(), ...cloudEntries].forEach((entry) => {
      const key = `${entry.source}:${entry.query.toLowerCase()}`;
      const existing = merged.get(key);
      if (!existing || entry.lastSearchedAt > existing.lastSearchedAt) {
        merged.set(key, existing ? { ...entry, count: Math.max(entry.count, existing.count) } : entry);
      }
    });
    const next = Array.from(merged.values()).sort((a, b) => b.lastSearchedAt - a.lastSearchedAt).slice(0, MAX_SEARCHES);
    if (typeof window !== 'undefined') {
      localStorage.setItem(historyKey(), JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('agrisence_search_history_updated'));
    }
    return next;
  } catch {
    return getSearchHistory();
  }
}
