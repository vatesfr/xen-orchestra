import type { ValueFormatter } from '@core/types/chart.ts'
import { useI18n } from 'vue-i18n'

export function useChartPercentFormatter(): ValueFormatter {
  const { n } = useI18n()

  return value => {
    if (value === null) {
      return ''
    }

    return n(value / 100, 'percent')
  }
}
