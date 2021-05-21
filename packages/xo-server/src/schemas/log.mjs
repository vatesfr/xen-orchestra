export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this log',
    },
    time: {
      type: 'string',
      description: 'timestamp (in milliseconds) of this log',
    },
    message: {
      type: 'string',
      description: 'human readable (short) description of this log',
    },
    namespace: {
      type: 'string',
      description: 'space to store logs',
    },
    data: {},
  },
  required: ['id', 'time', 'message', 'namespace'],
}
