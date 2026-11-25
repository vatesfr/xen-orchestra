import {
  DAYS_BEFORE_MONTH,
  type LongTermRetentionPeriod,
  toLongTermRetentionKeepSettings,
} from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'

describe('toLongTermRetentionKeepSettings', () => {
  it.each<LongTermRetentionPeriod>(['daily', 'weekly', 'monthly', 'yearly'])(
    'has no setting when there is no backup to keep for the %s period',
    period => {
      expect(toLongTermRetentionKeepSettings(period, undefined)).toEqual({})
    }
  )

  it('starts a day on the hour to keep', () => {
    expect(toLongTermRetentionKeepSettings('daily', 7)).toEqual({ firstHourOfTheDay: 7 })
  })

  it('keeps the first hour of the day, 0', () => {
    expect(toLongTermRetentionKeepSettings('daily', 0)).toEqual({ firstHourOfTheDay: 0 })
  })

  it('starts a week on the day to keep', () => {
    expect(toLongTermRetentionKeepSettings('weekly', 1)).toEqual({ firstDayOfWeek: 1 })
  })

  it('starts a month on the day to keep, counted from 0', () => {
    expect(toLongTermRetentionKeepSettings('monthly', 1)).toEqual({ firstDayOfMonth: 0 })
    expect(toLongTermRetentionKeepSettings('monthly', 5)).toEqual({ firstDayOfMonth: 4 })
  })

  it('starts a year on the first day of the month to keep', () => {
    expect(toLongTermRetentionKeepSettings('yearly', 0)).toEqual({ firstDayOfYear: 0 })
    expect(toLongTermRetentionKeepSettings('yearly', 2)).toEqual({ firstDayOfYear: DAYS_BEFORE_MONTH[2] })
    expect(toLongTermRetentionKeepSettings('yearly', 11)).toEqual({ firstDayOfYear: DAYS_BEFORE_MONTH[11] })
  })
})
