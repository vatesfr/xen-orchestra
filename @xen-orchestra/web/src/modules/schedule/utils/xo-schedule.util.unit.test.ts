import { getScheduleNextRun } from '@/modules/schedule/utils/xo-schedule.util.ts'
import { createSchedule } from '@/test/create-schedule.ts'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T10:30:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getScheduleNextRun', () => {
  it('has no next run for a disabled schedule', () => {
    expect(getScheduleNextRun(createSchedule({ enabled: false }))).toBeUndefined()
  })

  it('gives the next run of the schedule in its timezone', () => {
    const schedule = createSchedule({ cron: '0 1 * * *', timezone: 'Europe/Paris' })

    expect(getScheduleNextRun(schedule)).toEqual(new Date('2026-10-20T23:00:00Z'))
  })

  it('computes the next run in UTC when the schedule has no timezone', () => {
    const schedule = createSchedule({ cron: '0 1 * * *', timezone: undefined })

    expect(getScheduleNextRun(schedule)).toEqual(new Date('2026-10-21T01:00:00Z'))
  })
})
