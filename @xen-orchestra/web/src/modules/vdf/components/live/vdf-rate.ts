import { useI18n } from 'vue-i18n'

// Rates per second, as the live views show them: one decimal under 10, and
// never a non-zero rate rounded to 0
export function useVdfRate() {
  const { t, n } = useI18n()

  return (rate: number) => {
    if (rate > 0 && rate < 0.05) {
      return t('firewall:rate:below', { n: n(0.1, { maximumFractionDigits: 1 }) })
    }

    return t('firewall:hits:per-second', { n: n(rate, { maximumFractionDigits: rate >= 10 ? 0 : 1 }) })
  }
}
