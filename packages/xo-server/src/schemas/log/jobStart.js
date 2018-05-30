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
    scheduleId: {
      type: 'string',
      description: 'identifier of this schedule',
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
