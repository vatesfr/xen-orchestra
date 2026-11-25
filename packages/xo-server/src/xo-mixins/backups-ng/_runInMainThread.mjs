import { Task } from '@vates/task'

/**
 * Runs a backup in the xo-server process (`backups.disableWorkers`), as an abortable XO task.
 *
 * The run is aborted by:
 * - `app.tasks.abort(id)` on its root task,
 * - `signal`, the cancellation of the job run (`jobs.cancelJobRun()`),
 * - the abort of the task this function is called from, if any (e.g. the REST action "run schedule"): the backup
 *   task has its own `onProgress`, so it does not follow that task by itself.
 *
 * The abort is always made without a reason, so that the backup code always sees an `AbortError`.
 * The user who requested it, if any, is recorded as an info of the root task, with the type `abortRequested`.
 *
 * @param {object} params
 * @param {object} params.app
 * @param {() => Promise<unknown>} params.fn the backup, run inside the root task
 * @param {(log: object, event: object) => void} [params.onRootTaskStart]
 * @param {(log: object, event: object) => void} [params.onTaskUpdate]
 * @param {object} params.properties properties of the root task
 * @param {AbortSignal} [params.signal] the signal of the job run
 */
export async function runInMainThread({ app, fn, onRootTaskStart, onTaskUpdate, properties, signal }) {
  // the caller's signal is read before creating the backup task, which is not a subtask of the caller's task
  const followedSignals = [Task.abortSignal, signal].filter(signal => signal !== undefined)

  // only called once the task below has started
  let abortRequested = false
  const abort = () => {
    // the run may be aborted in several ways at once, e.g. the cancellation of the job run and of the caller's task
    if (abortRequested) {
      return
    }
    abortRequested = true

    // `tasks.abort()` and the abort listeners run synchronously in the context of the request that asked for it
    const user = app.apiContext?.user
    if (user !== undefined) {
      // only the id of the user: the task can be read by users who must not see the email of another one
      task.info('abort requested', { type: 'abortRequested', userId: user.id })
    }
    task.abort()
  }

  const task = new Task({
    properties,
    onProgress: app.tasks.createExternalProgressHandler({ abort, onRootTaskStart, onTaskUpdate }),
    // the remaining steps of an aborted backup are skipped, except its cleanup
    skipSubtasksAfterAbort: true,
  })

  try {
    return await task.run(async () => {
      for (const followedSignal of followedSignals) {
        if (followedSignal.aborted) {
          abort()
          Task.abortSignal.throwIfAborted()
        }
        followedSignal.addEventListener('abort', abort, { once: true })
      }

      const result = await fn()

      // the runners handle the errors of the VM backups in their tasks and resolve: an aborted run must still end
      // with the abort, not as a success
      Task.abortSignal.throwIfAborted()

      return result
    })
  } finally {
    for (const followedSignal of followedSignals) {
      followedSignal.removeEventListener('abort', abort)
    }
  }
}
