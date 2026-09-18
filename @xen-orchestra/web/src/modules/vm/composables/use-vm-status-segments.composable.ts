import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmStatusCounts = {
  running?: number
  paused?: number
  suspended?: number
  halted?: number
}

export function useVmStatusSegments(counts: MaybeRefOrGetter<VmStatusCounts | undefined>) {
  const { t } = useI18n()

  return computed<DonutChartWithLegendProps['segments']>(() => {
    const { running, paused, suspended, halted } = toValue(counts) ?? {}

    return [
      { label: t('vm:status:running', 2), value: running ?? 0, accent: 'success' },
      { label: t('vm:status:paused', 2), value: paused ?? 0, accent: 'info' },
      { label: t('vm:status:suspended', 2), value: suspended ?? 0, accent: 'neutral' },
      { label: t('vm:status:halted', 2), value: halted ?? 0, accent: 'danger' },
    ]
  })
}
