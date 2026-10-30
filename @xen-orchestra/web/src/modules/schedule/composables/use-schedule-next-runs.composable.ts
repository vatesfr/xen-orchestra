import { getNextRunDates } from '@/modules/schedule/utils/cron.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useScheduleNextRuns(
  rawCron: MaybeRefOrGetter<string>,
  rawTimezone: MaybeRefOrGetter<string | undefined>,
  rawCount: MaybeRefOrGetter<number> = 5
) {
  const { locale } = useI18n()

  const cron = toComputed(rawCron)
  const timezone = toComputed(rawTimezone)
  const count = toComputed(rawCount)

  return computed(() => {
    const format = new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone.value,
    })

    return getNextRunDates(cron.value, timezone.value, count.value).map(date => ({ date, label: format.format(date) }))
  })
}
