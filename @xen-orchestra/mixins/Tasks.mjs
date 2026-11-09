import { createLogger } from '@xen-orchestra/log'
import { EventEmitter } from 'node:events'
import { makeOnProgress } from '@vates/task/combineEvents'
import { forbiddenOperation, noSuchObject } from 'xo-common/api-errors.js'
import { Task, serializeError } from '@vates/task'
import iteratee from 'lodash/iteratee.js'
import stubTrue from 'lodash/stubTrue.js'

export { Task }

const { warn } = createLogger('xo:mixins:Tasks')

const noop = Function.prototype

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
              await this.deleteLog(id)
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

        for await (const taskLog of this.list({ filter: _ => _.status === 'pending' })) {
          taskLog.status = 'interrupted'
          taskLog.updatedAt = Date.now()
          await this.#store.put(taskLog.id, taskLog)
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

        this.deleteLog(data.key, cb)
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
   * - abort: `(reason) => …` called by `tasks.abort(rootId, reason)` while the
   *   root task runs. Without it, aborting the task fails with `forbiddenOperation`.
   *
   * The returned handler has an `end(status = 'interrupted', reason)` method for
   * a source that disappeared without ending its root task. It ends the open
   * tasks, innermost first, through the same path as the events of the source,
   * so the caller's hooks run and may change the status (for backups,
   * `handleBackupLog` recomputes it). Hook errors are rethrown once every open
   * task is ended. Once `end()` has ended the open tasks, later events are
   * dropped with a warning; called before the first event or after the root
   * task ended, it does nothing.
   */
  createExternalProgressHandler({ abort, onRootTaskEnd, onRootTaskStart, onTaskUpdate } = {}) {
    // error thrown by the caller's onRootTaskEnd: the final state must still be buffered (see onTaskUpdate below)
    let rootEndError
    // ids of the tasks accepted by makeOnProgress and not yet ended, in start order
    const openIds = new Set()
    let closed = false

    const onProgress = makeOnProgress({
      onRootTaskEnd: (taskLog, event) => {
        // the task can no longer be aborted once it ended
        this.#tasks.delete(taskLog.id)
        // subtasks the source left open are ended with their root: end() must not end them again
        openIds.clear()

        try {
          onRootTaskEnd?.(taskLog, event)
        } catch (error) {
          rootEndError = { error }
        }
      },
      onRootTaskStart: (taskLog, event) => {
        // tracked here, once makeOnProgress has registered it, in case the caller's hook throws
        openIds.add(taskLog.id)
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
        if (event.type === 'start') {
          openIds.add(taskLog.id)
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
          warn('failure in task update hook after the root task end hook failed', { error, event })
          throw rootError
        }
        throw error
      } finally {
        if (event.type === 'end') {
          openIds.delete(event.id)
        }
      }

      if (rootEndError !== undefined) {
        const { error } = rootEndError
        rootEndError = undefined
        throw error
      }
    }

    function handler(event) {
      if (closed) {
        warn('event received after the external task was ended', { event })
        return
      }
      feed(event)
    }

    function end(status = 'interrupted', reason) {
      // nothing to end: not started yet, or already ended
      if (openIds.size === 0) {
        return
      }
      closed = true

      let firstError
      // children were started after their parents: end them first
      for (const id of [...openIds].reverse()) {
        try {
          feed({ type: 'end', id, timestamp: Date.now(), status, result: reason })
        } catch (error) {
          firstError ??= { error }
        }
        openIds.delete(id)
      }

      if (firstError !== undefined) {
        throw firstError.error
      }
    }

    return Object.assign(handler, { end })
  }

  async abort(id, reason) {
    const task = this.#tasks.get(id)
    if (task !== undefined) {
      return task.abort(reason)
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

  async deleteLog(id, cb) {
    const log = await this.#getStored(id).catch(noop)

    if (log !== undefined) {
      await this.#store.del(id, cb)
      this.emit('remove', log)
    }
  }

  /**
   * Returns the log of a task: its latest state if it is live, even if not yet persisted (e.g. an external task
   * between its first event and its first write), its stored state otherwise.
   */
  async get(id) {
    const liveLog = this.#liveLogs.get(id)
    if (liveLog !== undefined) {
      // a copy, as the store returns: the live log keeps changing, and must not be changed by the caller
      return JSON.parse(JSON.stringify(liveLog))
    }
    return this.#getStored(id)
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

  async *list({ filter, limit = Infinity } = {}) {
    const predicate = filter === undefined ? stubTrue : typeof filter === 'function' ? filter : iteratee(filter)

    for await (const [, taskLog] of this.#store.iterator()) {
      if (predicate(taskLog)) {
        yield taskLog

        if (--limit < 1) {
          break
        }
      }
    }
  }

  async watch(id, cb) {
    // always called later: the caller may use the value returned by watch() in cb (e.g. to stop watching), and an
    // error of cb must not escape as an uncaught exception
    let stopped = false
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

    // live task whose final state is already known, even if not yet persisted
    const liveLog = this.#liveLogs.get(id)
    if (liveLog !== undefined && liveLog.status !== 'pending') {
      callLater(liveLog)
      return noop
    }

    // live task
    if (liveLog !== undefined || this.#tasks.has(id)) {
      // the flush of updates may run before the caller gets the return value of watch()
      this.on(id, callLater)

      return () => {
        stopped = true
        this.off(id, callLater)
      }
    }

    // unknown task will throw noSuchObject
    const taskLog = await this.get(id)

    // finished task
    callLater(taskLog)
    return noop
  }
}
