// according to https://xapi-project.github.io/xen-api/metrics.html
// The values are stored at intervals of:
//  - 5 seconds for the past 10 minutes
//  - one minute for the past 2 hours
//  - one hour for the past week
//  - one day for the past year
enum RRD_STEP {
  Seconds = 5,
  Minutes = 60,
  Hours = 3600,
  Days = 86400,
}

export enum GRANULARITY {
  Seconds = 'seconds',
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
}

export const RRD_STEP_FROM_STRING: { [key in GRANULARITY]: RRD_STEP } = {
  [GRANULARITY.Seconds]: RRD_STEP.Seconds,
  [GRANULARITY.Minutes]: RRD_STEP.Minutes,
  [GRANULARITY.Hours]: RRD_STEP.Hours,
  [GRANULARITY.Days]: RRD_STEP.Days,
}
