import { getRelativeTime } from '@core/composables/relative-time.composable.ts'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

// objects of a disconnected pool are kept by XO, flagged with the last time the
// pool was reached
export function useStaleObject(object: MaybeRefOrGetter<{ $lastSeen?: number } | undefined>) {
  const { d, locale } = useI18n()

  const lastSeen = computed(() => toValue(object)?.$lastSeen)

  const isStale = computed(() => lastSeen.value !== undefined)

  // e.g. "5 minutes ago (10/14/26, 10:42 AM)"
  const lastSeenLabel = computed(() =>
    lastSeen.value === undefined
      ? ''
      : `${getRelativeTime(new Date(lastSeen.value), locale)} (${d(lastSeen.value, 'datetime_short')})`
  )

  return { isStale, lastSeenLabel }
}
