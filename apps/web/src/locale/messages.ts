import { en } from './messages.en';
import { ru } from './messages.ru';

export const dictionaries = {
  en,
  ru,
};

export type AppLocale = keyof typeof dictionaries;
export type LocaleMessages = typeof en;

export const localeTags: Record<AppLocale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
};
