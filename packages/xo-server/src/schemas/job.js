export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    type: {
      enum: ['call'],
    },
    id: {
      type: 'string',
      description: 'job identifier',
    },
    name: {
      type: 'string',
      description: 'human readable name',
    },
    userId: {
      type: 'string',
      description: 'identifier of the user who have created the job (the permissions of the user are used by the job)',
    },
    key: {
      type: 'string',
      // TODO description
    },
    method: {
      type: 'string',
      description: 'called method',
    },
    paramsVector: {
      type: 'object',
    },
    timeout: {
      type: 'number',
      description: 'number of milliseconds after which the job is considered failed',
    },
  },
  required: ['type', 'id', 'userId', 'key', 'method'],
}
