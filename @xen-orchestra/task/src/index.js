export class Manager {
  constructor(hooks, id) {
    this._hooks = hooks
    this._id = id
  }

  async createTask({ message, data }, promiseOrFn) {
    const taskId = this._hooks.start({ message, data })
    const task = new Task(this._hooks, taskId)

    if (promiseOrFn === undefined) {
      return task
    }

    try {
      task.success(
        await (typeof promiseOrFn === 'function'
          ? promiseOrFn.apply(
              undefined,
              Array.prototype.slice.call(arguments, 2)
            )
          : promiseOrFn)
      )
    } catch (error) {
      task.failure(error)
    }
  }
}

class Task extends Manager {
  failure(error) {
    this._hooks.end({ error })
  }
}
