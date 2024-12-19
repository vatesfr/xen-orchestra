export class JobError extends Error {
  jobName: string | undefined
  args: any[] | undefined
  previousError: any

  constructor(message: string, jobName?: string, args?: any[], previousError?: any) {
    super(message)
    this.args = args
    this.jobName = jobName
    this.previousError = previousError
  }
}

export class JobRunningError extends JobError {}
