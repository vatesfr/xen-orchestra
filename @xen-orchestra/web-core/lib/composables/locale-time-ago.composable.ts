import type { UseTimeAgoMessages, UseTimeAgoUnitNamesDefault } from '@vueuse/core'
import { useTimeAgo } from '@vueuse/core'

export function useLocaleTimeAgo(date: Date, t: (key: string, params?: any) => string) {
  const pf = (past: boolean) => (past ? '.past' : '.future')
  const messages: UseTimeAgoMessages<UseTimeAgoUnitNamesDefault> = {
    justNow: t('time-ago.just-now'),
    past: n => n,
    future: n => n,
    month: (n, past) =>
      n === 1
        ? past
          ? t('time-ago.last-month')
          : t('time-ago.next-month')
        : t('time-ago.month' + pf(past), { count: n }),
    year: (n, past) =>
      n === 1
        ? past
          ? t('time-ago.last-year')
          : t('time-ago.next-year')
        : t('time-ago.year' + pf(past), { count: n }),
    day: (n, past) =>
      n === 1 ? (past ? t('time-ago.yesterday') : t('time-ago.tomorrow')) : t('time-ago.day' + pf(past), { count: n }),
    week: (n, past) =>
      n === 1
        ? past
          ? t('time-ago.last-week')
          : t('time-ago.next-week')
        : t('time-ago.week' + pf(past), { count: n }),
    hour: (n, past) => t('time-ago.hour' + pf(past), { count: n }),
    minute: (n, past) => t('time-ago.minute' + pf(past), { count: n }),
    second: (n, past) => t('time-ago.second' + pf(past), { count: n }),
    invalid: t(''),
  }

  return useTimeAgo(date, {
    fullDateFormatter: date => date.toLocaleString(),
    messages,
  })
}
