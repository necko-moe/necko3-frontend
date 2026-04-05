import { useTranslation } from "react-i18next";
import { enUS, ru, uk, zhCN } from "date-fns/locale";
import type { Locale } from "date-fns";

export const dateLocaleMap: Record<string, Locale> = {
  en: enUS,
  ru: ru,
  uk: uk,
  zh: zhCN,
};

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  return dateLocaleMap[i18n.language] ?? enUS;
}
