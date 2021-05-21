export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    event: {
      enum: ['job.end'],
    },
    runJobId: {
      type: 'string',
      description: 'instance id of this job',
    },
    error: {
      type: 'object',
      description: 'describe one failure, exists if no call has been made',
    },
  },
  required: ['event', 'runJobId'],
}
