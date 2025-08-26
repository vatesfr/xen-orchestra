import type {
  ProgressBarLegendType,
  ProgressBarThresholdPayload,
} from '@core/components/progress-bar/VtsProgressBar.vue'
import type { ProgressBarLegend } from '@core/components/ui/progress-bar/UiProgressBar.vue'
import type { Progress } from '@core/packages/progress/types.ts'
import type { ThresholdConfig } from '@core/packages/threshold/type.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, type Reactive, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function defaultProgressThresholds(tooltip?: string): ThresholdConfig<ProgressBarThresholdPayload> {
  return {
    80: { accent: 'warning', tooltip },
    90: { accent: 'danger', tooltip },
    default: {},
  }
}

export function cpuProgressThresholds(tooltip?: string): ThresholdConfig<ProgressBarThresholdPayload> {
  return {
    100: { accent: 'warning', tooltip },
    300: { accent: 'danger', tooltip },
    default: {},
  }
}

export function useProgressToLegend(
  rawType: MaybeRefOrGetter<ProgressBarLegendType | undefined>
): (label: string, progress: Progress | Reactive<Progress>) => ProgressBarLegend | undefined

export function useProgressToLegend(
  rawType: MaybeRefOrGetter<ProgressBarLegendType | undefined>,
  label: string,
  progress: Progress | Reactive<Progress>
): ComputedRef<ProgressBarLegend | undefined>

export function useProgressToLegend(
  rawType: MaybeRefOrGetter<ProgressBarLegendType | undefined>,
  label?: string,
  progress?: Progress | Reactive<Progress>
) {
  const { n } = useI18n()

  const type = computed(() => toValue(rawType))

  function toLegend(label: string, progress: Progress | Reactive<Progress>): ProgressBarLegend | undefined {
    switch (type.value) {
      case 'percent':
        return { label, value: n(toValue(progress.percentage) / 100, 'percent') }
      case 'bytes':
        return { label, value: formatSize(toValue(progress.current), 0) }
      case 'bytes-with-total':
        return {
          label,
          value: `${formatSize(toValue(progress.current), 0)} / ${formatSize(toValue(progress.total), 1)}`,
        }
      case 'value':
        return { label, value: n(toValue(progress.current)) }
      case 'value-with-total':
        return { label, value: `${n(toValue(progress.current))} / ${n(toValue(progress.total))}` }
      default:
        return undefined
    }
  }

  if (label && progress) {
    return computed(() => toLegend(label, progress))
  }

  return toLegend
}
