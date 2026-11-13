export type CreateScheduleBody = {
  cron: string
  /** Default to `false` */
  enabled?: boolean
  jobId: string
  name?: string
  timezone?: string
}

export type UpdateScheduleBody = {
  cron?: string
  enabled?: boolean
  name?: string
  timezone?: string
}
