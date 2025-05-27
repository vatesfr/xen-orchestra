import { useTimestamp } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export enum SECONDS {
  MINUTE = 60,
  HOUR = SECONDS.MINUTE * 60,
  DAY = SECONDS.HOUR * 24,
  WEEK = SECONDS.DAY * 7,
  MONTH = SECONDS.DAY * 30,
  YEAR = SECONDS.DAY * 365,
}

export type TimeThreshold = [number, Intl.RelativeTimeFormatUnit]

const timeThresholds: TimeThreshold[] = [
  [SECONDS.MINUTE, 'second'],
  [SECONDS.HOUR, 'minute'],
  [SECONDS.DAY, 'hour'],
  [SECONDS.WEEK, 'day'],
  [SECONDS.MONTH, 'week'],
  [SECONDS.YEAR, 'month'],
  [Infinity, 'year'],
]

export function useTimeAgo(referenceDate: MaybeRefOrGetter<Date | number | string>) {
  const { locale } = useI18n()

  const formatter = computed(() => new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }))

  const now = useTimestamp({ interval: 1000 })

  const referenceTime = computed(() => new Date(toValue(referenceDate)).getTime())

  const distance = computed(() => {
    const diff = Math.trunc((referenceTime.value - now.value) / 1000)

    if (Math.abs(diff) < 60) {
      return Math.trunc(diff / 10) * 10 || 0 // Avoid recomputing when the value changes from 0 to -0
    }

    return timeThresholds.reduce(
      (acc, [threshold]) => (Math.abs(acc) < threshold ? acc : Math.trunc(acc / threshold) * threshold),
      diff
    )
  })

  return computed(() => {
    const index = timeThresholds.findIndex(([threshold]) => Math.abs(distance.value) < threshold)
    const divisor = index > 0 ? timeThresholds[index - 1][0] : 1
    return formatter.value.format(Math.trunc(distance.value / divisor), timeThresholds[index][1])
  })
}
