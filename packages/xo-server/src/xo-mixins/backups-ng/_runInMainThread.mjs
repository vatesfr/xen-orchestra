import { Task } from '@vates/task'

/**
 * Runs a backup in the xo-server process (`backups.disableWorkers`), as an abortable XO task.
 *
 * The run is aborted by `app.tasks.abort(id)` on its root task, and by the abort of the task this function is called
 * from, if any (e.g. the REST action "run schedule"): the backup task has its own `onProgress`, so it does not follow
 * that task by itself.
 *
 * The abort is always made without a reason, so that the backup code always sees an `AbortError`, whatever the reason
 * given by the caller. The user who requested it, if any, is recorded as an info of the root task.
 *
 * @param {object} params
 * @param {object} params.app
 * @param {() => Promise<unknown>} params.fn the backup, run inside the root task
 * @param {(log: object, event: object) => void} [params.onRootTaskStart]
 * @param {(log: object, event: object) => void} [params.onTaskUpdate]
 * @param {object} params.properties properties of the root task
 */
export async function runInMainThread({ app, fn, onRootTaskStart, onTaskUpdate, properties }) {
  // read before creating the backup task, which is not a subtask of the caller's task
  const callerSignal = Task.abortSignal

  // only called once the task below has started
  const abort = () => {
    // `tasks.abort()` and the abort listeners run synchronously in the context of the request that asked for it
    const user = app.apiContext?.user
    if (user !== undefined) {
      task.info(`abort requested by ${user.email}`, { userId: user.id })
    }
    task.abort()
  }

  const task = new Task({
    properties,
    onProgress: app.tasks.createExternalProgressHandler({ abort, onRootTaskStart, onTaskUpdate }),
  })

  try {
    return await task.run(async () => {
      if (callerSignal !== undefined) {
        if (callerSignal.aborted) {
          abort()
          Task.abortSignal.throwIfAborted()
        }
        callerSignal.addEventListener('abort', abort, { once: true })
      }

      const result = await fn()

      // the runners handle the errors of the VM backups in their tasks and resolve: an aborted run must still end
      // with the abort, not as a success
      Task.abortSignal.throwIfAborted()

      return result
    })
  } finally {
    callerSignal?.removeEventListener('abort', abort)
  }
}
