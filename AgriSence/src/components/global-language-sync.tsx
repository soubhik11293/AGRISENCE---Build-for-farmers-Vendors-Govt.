import { useEffect } from 'react';
import { useLanguage, TRANSLATIONS } from '@/src/context/language-context';
import { EXTENDED_TRANSLATIONS } from '@/src/lib/translations/extended';
import { APP_PAGE_TRANSLATIONS } from '@/src/lib/translations/app-pages';
import { COMMAND_CENTER_TRANSLATIONS } from '@/src/lib/translations/command-center';

type AppliedTranslation = {
  source: string;
  rendered: string;
  language: string;
  pendingLanguage?: string;
};

const textRecords = new WeakMap<Text, AppliedTranslation>();
const attributeRecords = new WeakMap<Element, Map<string, AppliedTranslation>>();
const trackedTextNodes = new Set<Text>();
const trackedElements = new Set<Element>();
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

const INDIC_SCRIPT = /[\u0900-\u0D7F]/;
const LATIN_WORD = /[A-Za-z]{2,}/;
const SKIP_EXACT = new Set([
  'AgriSence',
  'APMC',
  'ICAR',
  'NDVI',
  'N-P-K',
  'Firebase',
  'Open-Meteo',
]);

function buildStaticPhraseMap(language: string) {
  const phraseMap = new Map<string, string>();
  const dictionaries = [
    TRANSLATIONS,
    EXTENDED_TRANSLATIONS,
    APP_PAGE_TRANSLATIONS,
    COMMAND_CENTER_TRANSLATIONS,
  ];

  for (const dictionary of dictionaries) {
    const english = dictionary.en || {};
    const selected = dictionary[language] || {};
    for (const [key, source] of Object.entries(english)) {
      const translated = selected[key];
      if (source && translated && source !== translated) {
        phraseMap.set(source.trim(), translated);
      }
    }
  }

  return phraseMap;
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  return Boolean(
    element.closest(
      'script, style, noscript, code, pre, svg, textarea, [contenteditable="true"], [translate="no"], .notranslate'
    )
  );
}

function isTranslatableText(value: string, element: Element | null) {
  const text = value.trim();
  if (!text || text.length < 2 || text.length > 800) return false;
  if (!LATIN_WORD.test(text) || INDIC_SCRIPT.test(text)) return false;
  if (SKIP_EXACT.has(text) || shouldSkipElement(element)) return false;
  if (/^(https?:\/\/|www\.|mailto:|tel:)/i.test(text)) return false;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text)) return false;
  return true;
}

function withOriginalWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] || '';
  const trailing = source.match(/\s*$/)?.[0] || '';
  return `${leading}${translated.trim()}${trailing}`;
}

function readStoredCache(language: string) {
  const cache = new Map<string, string>();
  try {
    const raw = localStorage.getItem(`agrisence-ui-translations-v2-${language}`);
    if (!raw) return cache;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [source, translated] of Object.entries(parsed)) {
      if (source && translated) cache.set(source, translated);
    }
  } catch {
    // A malformed or unavailable cache should never block the interface.
  }
  return cache;
}

function storeCache(language: string, cache: Map<string, string>) {
  try {
    const entries = Array.from(cache.entries()).slice(-1200);
    localStorage.setItem(
      `agrisence-ui-translations-v2-${language}`,
      JSON.stringify(Object.fromEntries(entries))
    );
  } catch {
    // Translation continues in-memory when browser storage is unavailable.
  }
}

/**
 * Completes language coverage for legacy UI copy that has not yet been moved
 * behind a t(...) key. Keyed translations render immediately; remaining text
 * is translated in small cached batches and observed across route/modal changes.
 */
export function GlobalLanguageSync() {
  const { language } = useLanguage();

  useEffect(() => {
    let active = true;
    let flushTimer: ReturnType<typeof setTimeout> | undefined;
    let cacheTimer: ReturnType<typeof setTimeout> | undefined;
    const abortController = new AbortController();
    const staticPhrases = buildStaticPhraseMap(language);
    const cache = readStoredCache(language);
    const pending = new Map<string, Array<(translated: string) => void>>();

    const scheduleCacheWrite = () => {
      if (cacheTimer) clearTimeout(cacheTimer);
      cacheTimer = setTimeout(() => storeCache(language, cache), 300);
    };

    const flushPending = async () => {
      flushTimer = undefined;
      if (!active || language === 'en' || pending.size === 0) return;

      const batch = Array.from(pending.keys()).slice(0, 80);
      const callbacks = batch.map((source) => pending.get(source) || []);
      batch.forEach((source) => pending.delete(source));

      try {
        const response = await fetch('/api/translate-ui', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: batch, targetLanguage: language }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error(`Translation request failed (${response.status})`);
        const payload = (await response.json()) as { translations?: string[] };
        const translations = payload.translations || [];

        batch.forEach((source, index) => {
          const translated = translations[index]?.trim() || source;
          if (translated !== source) {
            cache.set(source, translated);
            callbacks[index].forEach((apply) => apply(translated));
          }
        });
        scheduleCacheWrite();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('[AgriSence language] Could not translate a UI batch:', error);
        }
      } finally {
        if (active && pending.size > 0) {
          flushTimer = setTimeout(flushPending, 80);
        }
      }
    };

    const enqueue = (source: string, apply: (translated: string) => void) => {
      const staticTranslation = staticPhrases.get(source);
      if (staticTranslation) {
        apply(staticTranslation);
        return;
      }

      const cachedTranslation = cache.get(source);
      if (cachedTranslation) {
        apply(cachedTranslation);
        return;
      }

      const listeners = pending.get(source) || [];
      listeners.push(apply);
      pending.set(source, listeners);
      if (!flushTimer) flushTimer = setTimeout(flushPending, 60);
    };

    const processTextNode = (node: Text) => {
      const parent = node.parentElement;
      const current = node.nodeValue || '';
      let record = textRecords.get(node);

      // Preserve the form value when an <option> relies on its text as the
      // implicit value; only its visible label should be translated.
      if (parent?.tagName === 'OPTION' && !parent.hasAttribute('value')) {
        parent.setAttribute('value', current.trim());
      }

      if (!record) {
        if (!isTranslatableText(current, parent)) return;
        record = { source: current, rendered: current, language: 'en' };
        textRecords.set(node, record);
        trackedTextNodes.add(node);
      } else if (current !== record.rendered && current !== record.source) {
        if (!isTranslatableText(current, parent)) return;
        record.source = current;
        record.rendered = current;
        record.language = 'en';
        record.pendingLanguage = undefined;
      }

      if (language === 'en') {
        if (current !== record.source) node.nodeValue = record.source;
        record.rendered = record.source;
        record.language = 'en';
        record.pendingLanguage = undefined;
        return;
      }

      if (record.language === language || record.pendingLanguage === language) return;
      const source = record.source.trim();
      if (!isTranslatableText(source, parent)) return;
      record.pendingLanguage = language;

      enqueue(source, (translated) => {
        if (!active || language === 'en' || !node.isConnected) return;
        const latest = textRecords.get(node);
        if (!latest || latest.source.trim() !== source) return;
        const rendered = withOriginalWhitespace(latest.source, translated);
        node.nodeValue = rendered;
        latest.rendered = rendered;
        latest.language = language;
        latest.pendingLanguage = undefined;
      });
    };

    const processAttribute = (element: Element, attribute: string) => {
      const current = element.getAttribute(attribute) || '';
      let records = attributeRecords.get(element);
      if (!records) {
        records = new Map();
        attributeRecords.set(element, records);
      }
      let record = records.get(attribute);

      if (!record) {
        if (!isTranslatableText(current, element)) return;
        record = { source: current, rendered: current, language: 'en' };
        records.set(attribute, record);
        trackedElements.add(element);
      } else if (current !== record.rendered && current !== record.source) {
        if (!isTranslatableText(current, element)) return;
        record.source = current;
        record.rendered = current;
        record.language = 'en';
        record.pendingLanguage = undefined;
      }

      if (language === 'en') {
        if (current !== record.source) element.setAttribute(attribute, record.source);
        record.rendered = record.source;
        record.language = 'en';
        record.pendingLanguage = undefined;
        return;
      }

      if (record.language === language || record.pendingLanguage === language) return;
      const source = record.source.trim();
      record.pendingLanguage = language;
      enqueue(source, (translated) => {
        if (!active || !element.isConnected) return;
        const latest = attributeRecords.get(element)?.get(attribute);
        if (!latest || latest.source.trim() !== source) return;
        element.setAttribute(attribute, translated);
        latest.rendered = translated;
        latest.language = language;
        latest.pendingLanguage = undefined;
      });
    };

    const scanElement = (element: Element) => {
      if (shouldSkipElement(element)) return;
      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        if (element.hasAttribute(attribute)) processAttribute(element, attribute);
      });
    };

    const scanRoot = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        processTextNode(root as Text);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

      if (root.nodeType === Node.ELEMENT_NODE) scanElement(root as Element);
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE && shouldSkipElement(node as Element)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) processTextNode(node as Text);
        else scanElement(node as Element);
        node = walker.nextNode();
      }
    };

    // Restore tracked English source copy immediately when switching back.
    if (language === 'en') {
      trackedTextNodes.forEach((node) => {
        const record = textRecords.get(node);
        if (record && node.isConnected) {
          node.nodeValue = record.source;
          record.rendered = record.source;
          record.language = 'en';
          record.pendingLanguage = undefined;
        }
      });
      trackedElements.forEach((element) => {
        if (!element.isConnected) return;
        attributeRecords.get(element)?.forEach((record, attribute) => {
          element.setAttribute(attribute, record.source);
          record.rendered = record.source;
          record.language = 'en';
          record.pendingLanguage = undefined;
        });
      });
    }

    if (document.body) scanRoot(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          processTextNode(mutation.target as Text);
        } else if (mutation.type === 'attributes') {
          if (mutation.attributeName) processAttribute(mutation.target as Element, mutation.attributeName);
        } else {
          mutation.addedNodes.forEach(scanRoot);
        }
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
      });
    }

    return () => {
      active = false;
      observer.disconnect();
      abortController.abort();
      if (flushTimer) clearTimeout(flushTimer);
      if (cacheTimer) clearTimeout(cacheTimer);
    };
  }, [language]);

  return null;
}
