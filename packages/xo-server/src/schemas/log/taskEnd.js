export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    event: {
      enum: ['task.end'],
    },
    taskId: {
      type: 'string',
      description: 'identifier of this task',
    },
    status: {
      enum: ['canceled', 'failure', 'success'],
    },
    result: {},
  },
  required: ['event', 'taskId', 'status'],
}
