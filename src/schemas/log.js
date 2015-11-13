export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this log'
    },
    time: {
      type: 'string',
      description: 'timestamp (in miliseconds) of this log'
    },
    message: {
      type: 'string',
      description: 'human readable (short) description of this log'
    },
    namespace: {
      type: 'string',
      description: 'space to store logs'
    },
    data: {
      oneOf: [
        { '$ref': 'log/jobStart.js' },
        { '$ref': 'log/jobEnd.js' },
        { '$ref': 'log/jobCallStart.js' },
        { '$ref': 'log/jobCallEnd.js' }
      ]
    }
  },
  required: [
    'id',
    'time',
    'message',
    'namespace'
  ]
}
