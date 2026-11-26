import { createLogger } from '@xen-orchestra/log'
import { EventEmitter } from 'node:events'
import { makeOnProgress } from '@vates/task/combineEvents'
import { forbiddenOperation, noSuchObject } from 'xo-common/api-errors.js'
import { Task, serializeError } from '@vates/task'
import jsonStringifySafe from 'json-stringify-safe'
import iteratee from 'lodash/iteratee.js'
import stubTrue from 'lodash/stubTrue.js'

export { Task }

const { warn } = createLogger('xo:mixins:Tasks')

// a copy, as the store returns: a live log keeps changing, and must not be changed by the caller. Like the store of
// xo-server when it saves a log, circular references are replaced instead of making the copy fail.
const copyLog = log => {
  let json
  try {
    json = JSON.stringify(log)
  } catch {
    json = jsonStringifySafe(log)
  }
  return JSON.parse(json)
}

// the tasks of a log tree that have not ended, each one after its subtasks
function* openTasks(taskLog) {
  const { tasks } = taskLog
  if (tasks !== undefined) {
    for (const subtask of tasks) {
      yield* openTasks(subtask)
    }
  }
  if (taskLog.status === 'pending') {
    yield taskLog
  }
}

const DEFAULT_BACKUP_LOG_KEEP_DURATION = 31 * 24 * 60 * 60 * 1000

const BACKUP_LOG_NAMES = ['backup run', 'restore', 'metadataRestore']

const getLogAge = (log, now) => {
  if (log.end !== undefined) {
    return now - log.end
  }
  if (log.start !== undefined) {
    return now - log.start
  }
  // if we can't evaluate the log's age, assume it's too old
  return now
}

export default class Tasks extends EventEmitter {
  #logsToClearOnSuccess = new Set()

  // contains consolidated logs of all live and finished tasks
  #store

  // contains instance of running tasks (required for interaction, e.g. aborting)
  #tasks = new Map()

  #onProgressBuffer = new Map()
  #handleOnProgressScheduled = false

  // root logs of live tasks (internal and external), from their first event until their final state is persisted
  #liveLogs = new Map()

  // a watcher must not prevent the other watchers from being notified, nor the persistence of the other updates
  #emitSafely(event, taskLog) {
    for (const listener of this.rawListeners(event)) {
      try {
        listener.call(this, taskLog)
      } catch (error) {
        warn('failure in task watcher', { error, event, taskLog })
      }
    }
  }

  #handleOnProgressBuffer = async () => {
    const buf = this.#onProgressBuffer
    const liveLogs = this.#liveLogs
    const store = this.#store

    try {
      do {
        for (const [id, taskLog] of buf) {
          buf.delete(id)

          // read before the write: an event arriving during the write changes the log and buffers the id again
          const { status } = taskLog
          const isFinal = status !== 'pending'
          const deleteAfterNotify = isFinal && this.#logsToClearOnSuccess.delete(id) && status === 'success'

          // the final state of a clear-on-success task is notified on its id, then its log is deleted
          let written = false
          this.#emitSafely(id, taskLog)
          if (deleteAfterNotify) {
            try {
              const storedLog = await this.#deleteStored(id)
              if (storedLog !== undefined) {
                this.#emitSafely('remove', storedLog)
              }
              written = true
            } catch (error) {
              warn('failure on deleting task log from store', { error, taskLog })
            }
          } else {
            this.#emitSafely('update', taskLog)

            try {
              await store.put(id, taskLog)
              written = true
            } catch (error) {
              warn('failure on saving task log in store', { error, taskLog })
            }
          }

          // keep the live entry until the final state is persisted: a newer state of the same task may be buffered,
          // and if the write failed the store still holds an older state, which watchers must not get
          // (the entry then stays until restart, which marks the stored log interrupted)
          if (isFinal && written && !buf.has(id)) {
            liveLogs.delete(id)
          }
        }
      } while (buf.size !== 0) // new events may have been added during iteration
    } finally {
      // re-armed right after the last check of the buffer, with no await in between: an event buffered after it
      // schedules a new flush. Also re-armed if the flush failed, otherwise nothing is persisted until restart.
      this.#handleOnProgressScheduled = false
    }
  }

  #bufferTaskUpdate = taskLog => {
    const buf = this.#onProgressBuffer

    if (!this.#handleOnProgressScheduled) {
      this.#handleOnProgressScheduled = true

      // task events are buffered, deduplicated and will be handled one after
      // the others on the next tick to avoid race conditions
      process.nextTick(this.#handleOnProgressBuffer)
    }

    // Error objects are not JSON-ifiable by default
    const { result } = taskLog
    if (result instanceof Error && result.toJSON === undefined) {
      taskLog.result = serializeError(result)
    }

    const { $root } = taskLog
    const { id } = $root
    this.#liveLogs.set(id, $root)

    $root.updatedAt = Date.now()
    buf.set(id, $root)
  }

  #onProgress = makeOnProgress({
    onRootTaskEnd: taskLog => {
      const { id } = taskLog
      this.#tasks.delete(id)
    },
    onTaskUpdate: taskLog => {
      this.#bufferTaskUpdate(taskLog)
    },
  })

  #app

  constructor(app) {
    super()

    this.#app = app

    app.hooks
      .on('clean', () =>
        this.#gc({
          keepRegularLogs: app.config.getOptional('tasks.gc.keep') ?? 1e3,
          backupKeepDuration:
            app.config.getOptionalDuration('tasks.gc.backupKeepDuration') ?? DEFAULT_BACKUP_LOG_KEEP_DURATION,
        })
      )
      .on('start', async () => {
        this.#store = await app.getStore('tasks')

        // from the store only: list() also returns the live tasks, which must not be marked interrupted
        for await (const [, taskLog] of this.#store.iterator()) {
          if (taskLog.status === 'pending') {
            taskLog.status = 'interrupted'
            taskLog.updatedAt = Date.now()
            await this.#store.put(taskLog.id, taskLog)
          }
        }

        return () => this.#store.close()
      })
  }

  /**
   * keepRegularLogs: number of non-backup log entries to keep.
   * backupKeepDuration: Max duration to keep backup logs (only backup logs)
   */
  #gc({ keepRegularLogs, backupKeepDuration }) {
    return new Promise((resolve, reject) => {
      const db = this.#store

      // used to prevent resolving the promise before all undesired entries are deleted
      let count = 1

      const cb = () => {
        if (--count === 0) {
          resolve()
        }
      }

      const deleteEntry = data => {
        ++count

        // cb may already have been called by the store if the error comes after the deletion
        let done = false
        const once = () => {
          if (!done) {
            done = true
            cb()
          }
        }
        this.deleteLog(data.key, once).catch(error => {
          warn('failure on deleting task log from store', { error, id: data.key })
          once()
        })
      }

      const stream = db.createReadStream({
        reverse: true,
      })

      const now = Date.now()

      const onData = data => {
        if (BACKUP_LOG_NAMES.includes(data.value?.properties?.name)) {
          if (getLogAge(data.value, now) > backupKeepDuration) {
            return deleteEntry(data)
          }
        } else {
          if (--keepRegularLogs < 0) {
            return deleteEntry(data)
          }
        }
      }

      stream.on('data', onData)

      stream.on('end', cb).on('error', reject)
    })
  }

  /**
   * Creates an onProgress callback that feeds raw @vates/task events from an
   * external source (worker process, XO Proxy) into Tasks.mjs's store and
   * event emitter, making the task visible in the UI.
   *
   * Each call returns an independent makeOnProgress context (isolated taskLogs
   * Map), so concurrent backup jobs don't interfere with each other.
   *
   * Options:
   * - abort: `(reason, { skipCleanup }) => …` called by `tasks.abort(rootId, reason, { skipCleanup })` while the
   *   root task runs. Without it, aborting the task fails with `forbiddenOperation`.
   *   `skipCleanup` is `true` when the cleanup of the task must be stopped too (a second abort, see
   *   `Task#abortCleanup()`).
   *
   * The returned handler has an `end({ status = 'interrupted', reason })` method for
   * a source that disappeared without ending its root task. It ends the open
   * tasks, innermost first, through the same path as the events of the source,
   * so the caller's hooks run and may change the status (for backups,
   * `handleBackupLog` recomputes it). Hook errors are rethrown once every open
   * task is ended. Once `end()` has ended the open tasks, later events are
   * dropped: the first one with a warning, the next ones silently. Called
   * before the first event or after the root task ended, it does nothing.
   */
  createExternalProgressHandler({ abort, onRootTaskEnd, onRootTaskStart, onTaskUpdate } = {}) {
    // error thrown by the caller's onRootTaskEnd: the final state must still be buffered (see onTaskUpdate below)
    let rootEndError
    // logs of the root tasks accepted by makeOnProgress and not yet ended: end() walks their trees
    const openRoots = new Set()
    let closed = false
    // a source that keeps sending events after end() is reported once
    let warnedAfterClose = false

    const onProgress = makeOnProgress({
      onRootTaskEnd: (taskLog, event) => {
        // the task can no longer be aborted once it ended
        this.#tasks.delete(taskLog.id)
        // subtasks the source left open end with their root: end() no longer sees them
        openRoots.delete(taskLog)

        try {
          onRootTaskEnd?.(taskLog, event)
        } catch (error) {
          rootEndError = { error }
        }
      },
      onRootTaskStart: (taskLog, event) => {
        // tracked here, once makeOnProgress has registered it, in case the caller's hook throws
        openRoots.add(taskLog)
        if (abort !== undefined) {
          this.#tasks.set(taskLog.id, { abort })
        }
        onRootTaskStart?.(taskLog, event)
      },
      onTaskUpdate: (taskLog, event) => {
        // a subtask whose start had an unknown parent is registered by makeOnProgress, which then throws before
        // calling this hook: it has no root, so its later events are ignored
        if (taskLog.$root === undefined) {
          warn('event of a task without root task ignored', { event })
          return
        }
        this.#bufferTaskUpdate(taskLog)
        onTaskUpdate?.(taskLog, event)
      },
    })

    // feeds one event, then rethrows the error of the root end hook, if any
    const feed = event => {
      try {
        onProgress(event)
      } catch (error) {
        // the root end error carries the result of the task: it wins over a later hook error (onTaskUpdate),
        // and must not be thrown on a later, unrelated event
        if (rootEndError !== undefined) {
          const rootError = rootEndError.error
          rootEndError = undefined
          // the update hook may rethrow the same error, like handleBackupLog() and forwardResult() for backups: only
          // another error is worth a warning
          if (error !== rootError) {
            warn('failure in task update hook after the root task end hook failed', { error, event })
          }
          throw rootError
        }
        throw error
      }

      if (rootEndError !== undefined) {
        const { error } = rootEndError
        rootEndError = undefined
        throw error
      }
    }

    function handler(event) {
      if (closed) {
        if (!warnedAfterClose) {
          warnedAfterClose = true
          warn('event received after the external task was ended, later ones are dropped silently', { event })
        }
        return
      }
      feed(event)
    }

    function end({ status = 'interrupted', reason } = {}) {
      // nothing to end: not started yet, or already ended
      if (openRoots.size === 0) {
        return
      }
      closed = true

      // like the result of an event sent by a worker or a proxy: the update hook then rethrows the same object as the
      // root end hook (handleBackupLog() and forwardResult() for backups), which the log keeps serialized
      const result = reason instanceof Error ? serializeError(reason) : reason

      let thrown
      for (const root of [...openRoots]) {
        // listed before ending them, as ending a task may sort the subtasks of its parent (handleBackupLog)
        for (const { id } of [...openTasks(root)]) {
          try {
            feed({ type: 'end', id, timestamp: Date.now(), status, result })
          } catch (error) {
            // a root end error carries the result of its task: the first one wins, like in feed(); the others are
            // logged
            const isRoot = id === root.id
            if (thrown === undefined) {
              thrown = { error, id, isRoot }
            } else if (isRoot && !thrown.isRoot) {
              warn('failure in task end hook, superseded by the root task error', {
                error: thrown.error,
                id: thrown.id,
              })
              thrown = { error, id, isRoot }
            } else {
              warn('failure in task end hook', { error, id })
            }
          }
        }
      }

      if (thrown !== undefined) {
        throw thrown.error
      }
    }

    return Object.assign(handler, { end })
  }

  /**
   * @param {string} id
   * @param {*} [reason]
   * @param {object} [options]
   * @param {boolean} [options.skipCleanup] also stop the cleanup of the task (the cleanup steps it runs after an
   *   abort), whatever the abort already requested
   */
  async abort(id, reason, { skipCleanup = false } = {}) {
    const task = this.#tasks.get(id)
    if (task !== undefined) {
      if (typeof task.abortCleanup === 'function') {
        // internal task
        task.abort(reason)
        if (skipCleanup) {
          task.abortCleanup()
        }
        return
      }
      // handle of an external task
      return task.abort(reason, { skipCleanup })
    }

    // running external task without abort option
    const liveLog = this.#liveLogs.get(id)
    if (liveLog !== undefined && liveLog.status === 'pending') {
      throw forbiddenOperation('abort', 'this task cannot be aborted')
    }

    throw noSuchObject(id, 'task')
  }

  async clearLogs() {
    await this.#gc({ keepRegularLogs: 0, backupKeepDuration: 0 })
  }

  /**
   * Creates a new XO task
   *
   * @param {object} params
   * @param {string} params.name - Human readable name of the task
   * @param {string} [params.objectId] - Identifier of the object this task is related to
   * @param {string} [params.type] - Type of this task (e.g. `backup.vm`, `backup.metadata`)
   *
   * @returns {Task}
   */
  create(
    { name, objectId, userId = this.#app.apiContext?.user?.id, type, ...props },
    { clearLogOnSuccess = false } = {}
  ) {
    const tasks = this.#tasks

    const task = new Task({ properties: { ...props, name, objectId, userId, type }, onProgress: this.#onProgress })

    tasks.set(task.id, task)
    if (clearLogOnSuccess) {
      this.#logsToClearOnSuccess.add(task.id)
    }

    return task
  }

  /**
   * Deletes the log of a task, stored or live: a live task may not be stored yet, or only in an older state if its
   * last write failed.
   *
   * The log of a running task can be deleted too (XO 5 offers it for any task): the next event of the task writes it
   * again.
   */
  async deleteLog(id, cb) {
    const storedLog = await this.#deleteStored(id, cb)

    const liveLog = this.#liveLogs.get(id)
    this.#liveLogs.delete(id)

    const log = liveLog ?? storedLog
    if (log !== undefined) {
      this.#emitSafely('remove', log)
    }
  }

  // deletes the stored log of a task and returns it, undefined if there is none; other store errors are thrown
  async #deleteStored(id, cb) {
    let log
    try {
      log = await this.#getStored(id)
    } catch (error) {
      if (noSuchObject.is(error)) {
        // nothing to delete, but #gc waits for cb
        cb?.()
        return
      }
      throw error
    }
    await this.#store.del(id, cb)
    return log
  }

  /**
   * Returns the log of a task: its latest state if it is live, even if not yet persisted (e.g. an external task
   * between its first event and its first write), its stored state otherwise.
   */
  async get(id) {
    const liveLog = this.#liveLogs.get(id)
    if (liveLog !== undefined) {
      return copyLog(liveLog)
    }
    try {
      return await this.#getStored(id)
    } catch (error) {
      // the first event of the task may have arrived while the store was read
      const liveLog = this.#liveLogs.get(id)
      if (liveLog !== undefined && noSuchObject.is(error)) {
        return copyLog(liveLog)
      }
      throw error
    }
  }

  async #getStored(id) {
    try {
      return await this.#store.get(id)
    } catch (error) {
      if (error.type === 'NotFoundError') {
        throw noSuchObject(id, 'task')
      }
      throw error
    }
  }

  /**
   * Lists the logs of the tasks: a live task in its latest state, like get(), even if it is not stored yet.
   */
  async *list({ filter, limit = Infinity } = {}) {
    const predicate = filter === undefined ? stubTrue : typeof filter === 'function' ? filter : iteratee(filter)
    const liveLogs = this.#liveLogs

    // ids of the live tasks already listed from the store
    const listed = new Set()
    for await (const [, storedLog] of this.#store.iterator()) {
      const { id } = storedLog
      const liveLog = liveLogs.get(id)
      let taskLog = storedLog
      if (liveLog !== undefined) {
        listed.add(id)
        taskLog = copyLog(liveLog)
      } else if (storedLog.status === 'pending') {
        // pending logs of the previous runs are marked interrupted at start: this one belongs to a task that ended or
        // was deleted since the listing read the store
        try {
          taskLog = await this.#getStored(id)
        } catch (error) {
          if (noSuchObject.is(error)) {
            continue
          }
          throw error
        }
      }
      if (predicate(taskLog)) {
        yield taskLog

        if (--limit < 1) {
          return
        }
      }
    }

    // live tasks the store did not list: not stored yet, or stored after the listing started
    for (const [id, liveLog] of liveLogs) {
      if (!listed.has(id)) {
        const taskLog = copyLog(liveLog)
        if (predicate(taskLog)) {
          yield taskLog

          if (--limit < 1) {
            return
          }
        }
      }
    }
  }

  async watch(id, cb) {
    // always called later: the caller may use the value returned by watch() in cb (e.g. to stop watching), and an
    // error of cb must not escape as an uncaught exception
    let stopped = false
    const stop = () => {
      stopped = true
    }
    const callLater = taskLog =>
      setImmediate(() => {
        if (stopped) {
          return
        }
        try {
          cb(taskLog)
        } catch (error) {
          warn('failure in task watcher', { error, id, taskLog })
        }
      })

    // returns the function to stop watching if the task is live, undefined otherwise
    const watchLive = () => {
      // live task whose final state is already known, even if not yet persisted
      const liveLog = this.#liveLogs.get(id)
      if (liveLog !== undefined && liveLog.status !== 'pending') {
        callLater(liveLog)
        return stop
      }

      // live task
      if (liveLog !== undefined || this.#tasks.has(id)) {
        // the flush of updates may run before the caller gets the return value of watch()
        this.on(id, callLater)

        return () => {
          stop()
          this.off(id, callLater)
        }
      }
    }

    const stopLive = watchLive()
    if (stopLive !== undefined) {
      return stopLive
    }

    // unknown task will throw noSuchObject
    const taskLog = await this.get(id)

    // the first event of the task may have arrived while the store was read: watch it until it ends
    return watchLive() ?? (callLater(taskLog), stop)
  }
}
