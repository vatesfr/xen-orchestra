export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    event: {
      enum: ['jobCall.end'],
    },
    runJobId: {
      type: 'string',
      description: 'instance id of this job',
    },
    runCallId: {
      type: 'string',
      description: 'instance id of this call',
    },
    error: {
      type: 'object',
      description: 'describe one failure, exists if the call has failed',
    },
    returnedValue: {
      description: "call's result, exists if the call is a success",
    },
  },
  required: ['event', 'runJobId', 'runCallId'],
  oneOf: [{ required: ['error'] }, { required: ['returnedValue'] }],
}
