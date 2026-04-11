import { enMessages } from './locales/en.js';
import { viMessages } from './locales/vi.js';

const catalog = {
  vi: viMessages,
  en: enMessages,
} as const;

export type MessageLocale = keyof typeof catalog;
export type MessageKey = keyof (typeof catalog)['vi'];

export function resolveLocaleFromHeader(
  acceptLanguage?: string,
  fallback: MessageLocale = 'vi',
): MessageLocale {
  if (!acceptLanguage) {
    return fallback;
  }

  const lowered = acceptLanguage.toLowerCase();
  if (lowered.includes('en')) {
    return 'en';
  }

  if (lowered.includes('vi')) {
    return 'vi';
  }

  return fallback;
}

export function resolveMessage(
  key: string,
  locale: MessageLocale = 'vi',
  params?: Record<string, string | number>,
): string {
  const lang = catalog[locale] ?? catalog.vi;
  const fallback = catalog.vi;
  const raw =
    (lang as Record<string, string>)[key] ?? fallback[key as MessageKey] ?? key;

  if (!params) {
    return raw;
  }

  return Object.entries(params).reduce(
    (acc, [k, v]) =>
      acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    raw,
  );
}
