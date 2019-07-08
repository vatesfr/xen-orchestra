class Task {
  constructor(manager) {}
}

export default class Tasks {
  constructor(app) {
    this._schema = app.schemas.compile({
      additionalProperties: false,
      properties: {
        data: {},
        end: { type: 'number' },
        id: { type: 'string' },
        start: { type: 'number' },
        status: {
          enum: [
            // 'canceled',
            'failure',
            // 'interrupted',
            'pending',
            // 'skipped',
            'success',
          ],
        },
        tasks: { type: 'array', items: { type: 'string' } },
      },
      required: ['data', 'id', 'start', 'status'],
      type: 'object',
    })

    // app.api.addMethods({
    //   tasks: {},
    // })
    // app.api.addClass('task')
  }
}
