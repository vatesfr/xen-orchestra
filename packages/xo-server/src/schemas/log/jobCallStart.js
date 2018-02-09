export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    event: {
      enum: ['jobCall.start'],
    },
    runJobId: {
      type: 'string',
      description: 'instance id of this job',
    },
    method: {
      type: 'string',
      description: 'method linked to this call',
    },
    params: {
      type: 'object',
      description: 'params of the called method',
    },
  },
  required: ['event', 'runJobId', 'method', 'params'],
}
