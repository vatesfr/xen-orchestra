import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type HostStatusCounts = {
  running?: number
  disabled?: number
  halted?: number
}

export function useHostStatusSegments(counts: MaybeRefOrGetter<HostStatusCounts | undefined>) {
  const { t } = useI18n()

  return computed<DonutChartWithLegendProps['segments']>(() => {
    const { running, disabled, halted } = toValue(counts) ?? {}

    return [
      { label: t('host:status:running', 2), value: running ?? 0, accent: 'success' },
      // TODO instead of tooltips for disabled , we need to add a modal with a button
      { label: t('host:status:disabled', 2), value: disabled ?? 0, accent: 'muted' },
      { label: t('host:status:halted', 2), value: halted ?? 0, accent: 'danger' },
    ]
  })
}
