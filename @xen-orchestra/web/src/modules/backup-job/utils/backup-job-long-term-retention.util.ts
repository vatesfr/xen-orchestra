export type LongTermRetentionPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const LONG_TERM_RETENTION_FIELDS = [
  { period: 'daily', retention: 'ltrDailyRetention', keep: 'ltrDailyKeep' },
  { period: 'weekly', retention: 'ltrWeeklyRetention', keep: 'ltrWeeklyKeep' },
  { period: 'monthly', retention: 'ltrMonthlyRetention', keep: 'ltrMonthlyKeep' },
  { period: 'yearly', retention: 'ltrYearlyRetention', keep: 'ltrYearlyKeep' },
] as const satisfies readonly { period: LongTermRetentionPeriod; retention: string; keep: string }[]

export const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

const KEEP_SETTINGS: Record<LongTermRetentionPeriod, (keep: number) => Record<string, unknown>> = {
  daily: hour => ({ firstHourOfTheDay: hour }),
  weekly: weekDay => ({ firstDayOfWeek: weekDay }),
  monthly: monthDay => ({ firstDayOfMonth: monthDay - 1 }),
  yearly: month => ({ firstDayOfYear: DAYS_BEFORE_MONTH[month] }),
}

export function toLongTermRetentionKeepSettings(
  period: LongTermRetentionPeriod,
  keep: number | undefined
): Record<string, unknown> {
  return keep === undefined ? {} : KEEP_SETTINGS[period](keep)
}
