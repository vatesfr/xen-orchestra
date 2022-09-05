import { createI18n } from "vue-i18n";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

interface Locales {
  [key: string]: {
    code: string;
    name: string;
  };
}

export const locales: Locales = {
  en: {
    code: "en",
    name: "English",
  },
  fr: {
    code: "fr",
    name: "Français",
  },
};

export default createI18n<[typeof en], "en" | "fr">({
  locale: localStorage.getItem("lang") ?? "en",
  fallbackLocale: "en",
  messages: {
    en,
    fr,
  },
  datetimeFormats: {
    en: {
      date_short: {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      },
      date_medium: {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
      date_long: {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
      datetime_short: {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      datetime_medium: {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      datetime_long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      time: {
        hour: "2-digit",
        minute: "2-digit",
      },
    },
    fr: {
      date_short: {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      },
      date_medium: {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
      date_long: {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
      datetime_short: {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      datetime_medium: {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      datetime_long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      time: {
        hour: "2-digit",
        minute: "2-digit",
      },
    },
  },
});
