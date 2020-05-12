import { SyncThenable } from './_SyncThenable'

const logAfterEnd = () => {
  throw new Error('task has already ended')
}

export class TaskLogger {
  constructor(logFn, parentId) {
    this._log = logFn
    this._parentId = parentId
    this._taskId = undefined
  }

  get taskId() {
    const taskId = this._taskId
    if (taskId === undefined) {
      throw new Error('start the task first')
    }
    return taskId
  }

  // create a subtask
  fork() {
    return new TaskLogger(this._log, this.taskId)
  }

  info(message, data) {
    return this._log({
      data,
      event: 'info',
      message,
      taskId: this.taskId,
    })
  }

  run(message, data, fn) {
    if (arguments.length === 2) {
      fn = data
      data = undefined
    }

    return SyncThenable.tryUnwrap(
      SyncThenable.fromFunction(() => {
        if (this._taskId !== undefined) {
          throw new Error('task has already started')
        }

        this._taskId = Math.random().toString(36).slice(2)

        return this._log({
          data,
          event: 'start',
          message,
          parentId: this._parentId,
          taskId: this.taskId,
        })
      })
        .then(fn)
        .then(
          result => {
            const log = this._log
            this._log = logAfterEnd
            return SyncThenable.resolve(
              log({
                event: 'end',
                result,
                status: 'success',
                taskId: this.taskId,
              })
            ).then(() => result)
          },
          error => {
            const log = this._log
            this._log = logAfterEnd
            return SyncThenable.resolve(
              log({
                event: 'end',
                result: error,
                status: 'failure',
                taskId: this.taskId,
              })
            ).then(() => {
              throw error
            })
          }
        )
    )
  }

  warning(message, data) {
    return this._log({
      data,
      event: 'warning',
      message,
      taskId: this.taskId,
    })
  }

  wrapFn(fn, message, data) {
    const logger = this
    return function () {
      return logger.run(message, data, () => fn.apply(this, arguments))
    }
  }
}
