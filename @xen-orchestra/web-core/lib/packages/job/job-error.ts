export class JobError extends Error {
  jobName: string | undefined
  args: any[] | undefined

  constructor(message: string, jobName?: string, args?: any[]) {
    super(message)
    this.args = args
    this.jobName = jobName
  }
}

export class JobRunningError extends JobError {}
