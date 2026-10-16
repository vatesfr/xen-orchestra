import { formatDateTime } from '@core/utils/time.util.ts'
import { createSharedComposable, formatTimeAgoIntl, useNow } from '@vueuse/core'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

// a single clock for all the stale objects displayed, often enough for "x minutes ago"
const useSharedNow = createSharedComposable(() => useNow({ interval: 30_000 }))

// formats the last time the pool of a stale object was reached, e.g.
// "5 minutes ago (2026-10-14 10:42:00)", kept up to date while displayed
export function useLastSeenFormatter() {
  const { locale } = useI18n()
  const now = useSharedNow()

  return (lastSeen: number) =>
    `${formatTimeAgoIntl(new Date(lastSeen), { locale: locale.value }, now.value)} (${formatDateTime(lastSeen)})`
}

// objects of a disconnected pool are kept by XO, flagged with the last time the
// pool was reached
export function useStaleObject(object: MaybeRefOrGetter<{ $lastSeen?: number } | undefined>) {
  const formatLastSeen = useLastSeenFormatter()

  const lastSeen = computed(() => toValue(object)?.$lastSeen)

  const isStale = computed(() => lastSeen.value !== undefined)

  const lastSeenLabel = computed(() => (lastSeen.value === undefined ? '' : formatLastSeen(lastSeen.value)))

  return { isStale, lastSeenLabel }
}
