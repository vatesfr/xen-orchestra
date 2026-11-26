import { Task } from '@vates/task'

/**
 * Runs a backup in the xo-server process (`backups.disableWorkers`), as an abortable XO task.
 *
 * The run is aborted by:
 * - `app.tasks.abort(id)` on its root task,
 * - `signal`, the cancellation of the job run (`jobs.cancelJobRun()`),
 * - the abort of the task this function is called from, if any (e.g. the REST action "run schedule"): the backup
 *   task has its own `onProgress`, so it does not follow that task by itself. The same goes for the skip of its
 *   cleanup (`abortCleanup()`), which skips the cleanup of the run.
 *
 * The abort is always made without a reason, so that the backup code always sees an `AbortError`.
 * The user who requested it, if any, is recorded as an info of the root task, with the type `abortRequested`.
 *
 * A second request, `app.tasks.abort(id, reason, { skipCleanup: true })`, also stops the cleanup of the run (the
 * cleanup signal of the task, see `Task#abortCleanup()`), and is recorded the same way, with the type
 * `cleanupSkipRequested`. Each request is applied and recorded once, in any order: repeating one changes nothing.
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
  const followedCleanupSignal = Task.cleanupSignal

  let isAbortRequested = false
  let isCleanupSkipRequested = false

  // only called once the task below has started
  const abort = (_reason, { skipCleanup = false } = {}) => {
    // `tasks.abort()` and the abort listeners run synchronously in the context of the request that asked for it
    // only the id of the user: the task can be read by users who must not see the email of another one
    const user = app.apiContext?.user

    // the run may be aborted in several ways at once, e.g. the cancellation of the job run and of the caller's task
    if (!isAbortRequested) {
      isAbortRequested = true
      if (user !== undefined) {
        task.info('abort requested', { type: 'abortRequested', userId: user.id })
      }
      task.abort()
    }

    if (skipCleanup && !isCleanupSkipRequested) {
      isCleanupSkipRequested = true
      if (user !== undefined) {
        task.info('cleanup skip requested', { type: 'cleanupSkipRequested', userId: user.id })
      }
      task.abortCleanup()
    }
  }

  // the followed signals trigger level 1 only
  const onFollowedSignalAbort = () => abort()
  // skipping the cleanup of the caller's task skips the one of the run, and aborts it as well
  const onFollowedCleanupSignalAbort = () => abort(undefined, { skipCleanup: true })

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
        followedSignal.addEventListener('abort', onFollowedSignalAbort, { once: true })
      }

      if (followedCleanupSignal !== undefined) {
        if (followedCleanupSignal.aborted) {
          onFollowedCleanupSignalAbort()
        } else {
          followedCleanupSignal.addEventListener('abort', onFollowedCleanupSignalAbort, { once: true })
        }
      }

      const result = await fn()

      // the runners handle the errors of the VM backups in their tasks and resolve: an aborted run must still end
      // with the abort, not as a success
      Task.abortSignal.throwIfAborted()

      return result
    })
  } finally {
    for (const followedSignal of followedSignals) {
      followedSignal.removeEventListener('abort', onFollowedSignalAbort)
    }
    followedCleanupSignal?.removeEventListener('abort', onFollowedCleanupSignalAbort)
  }
}
