import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  dictionaries,
  localeTags,
  type AppLocale,
  type LocaleMessages,
} from './messages';

const LOCALE_STORAGE_KEY = 'mini-zapier:locale';

export interface LocaleContextValue {
  locale: AppLocale;
  localeTag: string;
  messages: LocaleMessages;
  setLocale: (locale: AppLocale) => void;
  formatNumber: (value: number) => string;
  formatDateTime: (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatDurationMs: (durationMs: number) => string;
}

function getInitialLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (storedLocale === 'en' || storedLocale === 'ru') {
    return storedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<AppLocale>(() => getInitialLocale());

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = localeTags[locale];
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const localeTag = localeTags[locale];
    const messages = dictionaries[locale];
    const numberFormatter = new Intl.NumberFormat(localeTag);

    function formatNumber(value: number): string {
      return numberFormatter.format(value);
    }

    function formatDateTime(
      value: string | null | undefined,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      if (!value) {
        return messages.common.emptyValue;
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return messages.common.emptyValue;
      }

      return new Intl.DateTimeFormat(localeTag, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...options,
      }).format(date);
    }

    function formatDurationMs(durationMs: number): string {
      if (durationMs < 1000) {
        return `${formatNumber(durationMs)} ${messages.common.durationUnits.ms}`;
      }

      const totalSeconds = Math.round(durationMs / 1000);

      if (totalSeconds < 60) {
        return `${formatNumber(totalSeconds)} ${messages.common.durationUnits.sec}`;
      }

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes < 60) {
        return `${formatNumber(minutes)}${messages.common.durationUnits.min} ${formatNumber(seconds)}${messages.common.durationUnits.sec}`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      return `${formatNumber(hours)}${messages.common.durationUnits.hour} ${formatNumber(remainingMinutes)}${messages.common.durationUnits.min}`;
    }

    return {
      locale,
      localeTag,
      messages,
      setLocale,
      formatNumber,
      formatDateTime,
      formatDurationMs,
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider.');
  }

  return context;
}
