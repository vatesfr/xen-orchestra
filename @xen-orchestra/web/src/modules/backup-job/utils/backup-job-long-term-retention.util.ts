export type LongTermRetentionPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const LONG_TERM_RETENTION_FIELDS = [
  { period: 'daily', retention: 'ltrDailyRetention', keep: 'ltrDailyKeep' },
  { period: 'weekly', retention: 'ltrWeeklyRetention', keep: 'ltrWeeklyKeep' },
  { period: 'monthly', retention: 'ltrMonthlyRetention', keep: 'ltrMonthlyKeep' },
  { period: 'yearly', retention: 'ltrYearlyRetention', keep: 'ltrYearlyKeep' },
] as const satisfies readonly { period: LongTermRetentionPeriod; retention: string; keep: string }[]
