import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

interface Locales {
  [key: string]: {
    code: string
    name: string
  }
}

export const locales: Locales = {
  en: {
    code: 'en',
    name: 'English',
  },
  es: {
    code: 'es',
    name: 'Español',
  },
  fr: {
    code: 'fr',
    name: 'Français',
  },
  de: {
    code: 'de',
    name: 'Deutsch',
  },
  fa: {
    code: 'fa',
    name: 'Persian',
  },
  cs: {
    code: 'cs',
    name: 'čeština',
  },
  sv: {
    code: 'sv',
    name: 'Svenska',
  },
}

export default createI18n({
  locale: localStorage.getItem('lang') ?? 'en',
  fallbackLocale: 'en',
  messages,
  missing: (locale, key, vm) => {
    if (!import.meta.env.DEV) {
      return key
    }

    console.warn(`i18n key not found: ${key}`, `Used in ${vm?.type.__name ?? 'unknown component'}`)

    return `🌎❗⟨${key}⟩`
  },
  datetimeFormats: {
    en: {
      date_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      date_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      date_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      datetime_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
      },
    },
    es: {
      date_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      date_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      date_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      datetime_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
      },
    },
    fr: {
      date_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      date_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      date_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      datetime_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
      },
    },
    de: {
      date_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      date_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      date_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      datetime_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
      },
    },
    fa: {
      date_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      date_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      date_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      datetime_short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      datetime_long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
      },
    },
  },
  numberFormats: {
    en: {
      percent: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    },
    es: {
      percent: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    },
    fr: {
      percent: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    },
    de: {
      percent: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    },
    fa: {
      percent: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    },
  },
})
