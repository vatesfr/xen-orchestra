import { useScheduleNextRuns } from '@/modules/schedule/composables/use-schedule-next-runs.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T10:30:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountNextRuns(cron: string, timezone: string | undefined, count?: number) {
  return mountComposable(() => {
    const { locale } = useI18n()

    return { nextRuns: useScheduleNextRuns(cron, timezone, count), locale }
  }).wrapper.vm
}

function formatRun(locale: string, timezone: string, date: Date) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date)
}

it('gives the 5 next runs by default', () => {
  expect(mountNextRuns('0 1 * * *', 'Europe/Paris').nextRuns).toHaveLength(5)
})

it('gives the requested number of next runs, labelled in the timezone of the schedule', () => {
  const result = mountNextRuns('0 1 * * *', 'Europe/Paris', 2)
  const dates = [new Date('2026-10-20T23:00:00Z'), new Date('2026-10-21T23:00:00Z')]

  expect(result.nextRuns).toEqual(dates.map(date => ({ date, label: formatRun(result.locale, 'Europe/Paris', date) })))
})

it('has no next run for an invalid cron', () => {
  expect(mountNextRuns('not a cron', 'Europe/Paris').nextRuns).toEqual([])
})
