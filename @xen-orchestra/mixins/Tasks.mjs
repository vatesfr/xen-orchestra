import { createLogger } from '@xen-orchestra/log'
import { EventEmitter } from 'node:events'
import { makeOnProgress } from '@vates/task/combineEvents'
import { noSuchObject } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'
import iteratee from 'lodash/iteratee.js'
import stubTrue from 'lodash/stubTrue.js'

export { Task }

const { warn } = createLogger('xo:mixins:Tasks')

const formatId = timestamp => timestamp.toString(36).padStart(9, '0')

const noop = Function.prototype

const DEFAULT_BACKUP_LOG_KEEP_DURATION = 31 * 24 * 60 * 60 * 1000 /* TO REMOVE */ * 5

// Create a serializable object from an error.
const serializeError = error => ({
  ...error, // Copy enumerable properties.
  code: error.code,
  message: error.message,
  name: error.name,
  stack: error.stack,
})

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
  #handleOnProgressBuffer = async () => {
    const buf = this.#onProgressBuffer
    const store = this.#store

    do {
      for (const [id, taskLog] of buf) {
        buf.delete(id)
        if (taskLog === null) {
          try {
            await this.deleteLog(id)
          } catch (error) {
            warn('failure on deleting task log from store', { error, taskLog })
          }
        } else {
          this.emit(id, taskLog)
          this.emit('update', taskLog)

          try {
            await store.put(id, taskLog)
          } catch (error) {
            warn('failure on saving task log in store', { error, taskLog })
          }
        }
      }
    } while (buf.size !== 0) // new events may have been added during iteration

    this.#handleOnProgressScheduled = false
  }

  #onProgress = makeOnProgress({
    onRootTaskEnd: taskLog => {
      const { id } = taskLog
      this.#tasks.delete(id)
    },
    onTaskUpdate: taskLog => {
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
      const { status, id } = $root
      if (status !== 'pending') {
        if (this.#logsToClearOnSuccess.has(id)) {
          this.#logsToClearOnSuccess.delete(id)

          if (status === 'success') {
            return buf.set(id, null)
          }
        }
      }

      $root.updatedAt = Date.now()
      buf.set(id, $root)
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
        if (data.value?.properties?.name === 'backup run') {
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

  async abort(id, reason) {
    const task = this.#tasks.get(id)
    if (task === undefined) {
      throw noSuchObject(id, 'task')
    }
    return task.abort(reason)
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

    // Use a compact, sortable, string representation of the creation date
    //
    // Due to the padding, dates are sortable up to 5188-04-22T11:04:28.415Z
    let now = Date.now()
    let id
    while (tasks.has((id = formatId(now)))) {
      // if the current id is already taken, use the next millisecond
      ++now
    }
    task.id = id

    tasks.set(id, task)
    if (clearLogOnSuccess) {
      this.#logsToClearOnSuccess.add(id)
    }

    return task
  }

  async deleteLog(id, cb) {
    const log = await this.get(id).catch(noop)

    if (log !== undefined) {
      await this.#store.del(id, cb)
      this.emit('remove', log)
    }
  }

  async get(id) {
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
    // live task
    if (this.#tasks.has(id)) {
      this.on(id, cb)

      let stopWatch = () => {
        this.off(id, cb)
        stopWatch = noop
      }
      return () => stopWatch()
    }

    // unknown task will throw noSuchObject
    const taskLog = await this.get(id)

    // finished task
    setImmediate(cb, taskLog)
    return noop
  }
}
