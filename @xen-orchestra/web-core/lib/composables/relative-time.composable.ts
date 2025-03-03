import type { MaybeRef } from '@vueuse/core'
import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'

export default function useRelativeTime(fromDate: MaybeRef<Date>, toDate: MaybeRef<Date>) {
  const { t } = useI18n()
  const fromTime = computed(() => unref(fromDate).getTime())
  const toTime = computed(() => unref(toDate).getTime())
  const isPast = computed(() => toTime.value > fromTime.value)
  const diff = computed(() => Math.abs(toTime.value - fromTime.value))

  return computed(() => {
    if (diff.value < 10000) {
      return t('relative-time.now')
    }

    const years = Math.floor(diff.value / 31556952000)
    let timeLeft = diff.value % 31556952000

    const months = Math.floor(timeLeft / 2629746000)
    timeLeft = timeLeft % 2629746000

    const days = Math.floor(timeLeft / 86400000)
    timeLeft = timeLeft % 86400000

    const hours = Math.floor(timeLeft / 3600000)
    timeLeft = timeLeft % 3600000

    const minutes = Math.floor(timeLeft / 60000)
    timeLeft = timeLeft % 60000
    const seconds = Math.floor(timeLeft / 1000)

    const parts = []

    if (years > 0) {
      parts.push(t('relative-time.year', { n: years }))
    }

    if (months > 0) {
      const n = days >= 15 ? months + 1 : months
      parts.push(t('relative-time.month', { n }))
    }

    if (years === 0 && months === 0) {
      if (days > 0) {
        parts.push(t('relative-time.day', { n: days }))
      }

      if (days <= 1 && hours > 0) {
        parts.push(t('relative-time.hour', { n: hours }))
      }

      if (days === 0 && minutes > 0) {
        parts.push(t('relative-time.minute', { n: minutes }))
      }

      if (days === 0 && seconds > 0) {
        parts.push(t('relative-time.second', { n: seconds }))
      }
    }

    return t(isPast.value ? 'relative-time.past' : 'relative-time.future', {
      str: parts.join(' '),
    })
  })
}
