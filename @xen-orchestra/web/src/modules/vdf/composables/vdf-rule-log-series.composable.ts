import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import { logRateSeries } from '@/modules/vdf/utils/vdf-rate-series.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

// CHART (vdf#59): rule log entries per minute, over the last hour or as far
// back as the log's last lines go (`log`: all its entries), of `entries`
// (what a table shows, with its filters; the whole log otherwise)
const LOG_WINDOW_MS = 60 * 60_000

const LOG_BUCKET_MS = 60_000

export function useVdfRuleLogSeries(
  log: MaybeRefOrGetter<VdfRuleLogEntry[]>,
  entries?: MaybeRefOrGetter<VdfRuleLogEntry[]>
) {
  const { t, d } = useI18n()

  const logSince = computed(() => {
    const times = toValue(log)
      .map(entry => Date.parse(entry.time))
      .filter(time => !Number.isNaN(time))

    if (times.length === 0) {
      return undefined
    }

    return Math.max(Math.min(...times), Date.now() - LOG_WINDOW_MS)
  })

  const logSeries = computed(() => {
    const shown = toValue(entries ?? log)

    // a single minute isn't a trend; nothing logged (UX P3-6): no empty
    // chart, the table's empty state says it
    if (logSince.value === undefined || Date.now() - logSince.value < 2 * LOG_BUCKET_MS || shown.length === 0) {
      return undefined
    }

    // complete minutes only: the one in progress would always dip at the end
    return logRateSeries(shown, {
      since: logSince.value,
      until: Math.floor(Date.now() / LOG_BUCKET_MS) * LOG_BUCKET_MS - 1,
      bucketMs: LOG_BUCKET_MS,
    })
  })

  const logCaption = computed(() =>
    logSince.value === undefined
      ? ''
      : // "as filtered below" when it charts a table's rows
        t(entries === undefined ? 'firewall:log:chart:all' : 'firewall:log:chart', {
          time: d(new Date(logSince.value), { hour: '2-digit', minute: '2-digit' }),
        })
  )

  return { logSeries, logCaption }
}
