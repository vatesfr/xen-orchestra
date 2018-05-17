export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    event: {
      enum: ['task.start'],
    },
    parentId: {
      type: 'string',
      description: 'identifier of the parent task or job',
    },
    data: {},
  },
  required: ['event'],
}
