export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    event: {
      enum: ['job.start'],
    },
    userId: {
      type: 'string',
      description: 'user who executes this job',
    },
    jobId: {
      type: 'string',
      description: 'identifier of this job',
    },
    jobName: {
      type: 'string',
      description: 'name of this job when it was started',
    },
    scheduleId: {
      type: 'string',
      description: 'identifier of the schedule which ran the job',
    },
    key: {
      type: 'string',
    },
    type: {
      default: 'call',
      enum: ['backup', 'call'],
    },
    data: {},
  },
  required: ['event', 'userId', 'jobId'],
}
