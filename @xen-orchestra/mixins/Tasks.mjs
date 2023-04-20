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

export default class Tasks extends EventEmitter {
  // contains consolidated logs of all live and finished tasks
  #store

  // contains instance of running tasks (required for interaction, e.g. aborting)
  #tasks = new Map()

  #onProgress = makeOnProgress({
    onRootTaskEnd: taskLog => {
      const { id } = taskLog
      this.#tasks.delete(id)
    },
    onTaskUpdate: async taskLog => {
      try {
        const { $root } = taskLog

        $root.updatedAt = Date.now()

        const { id } = $root
        await this.#store.put(id, $root)
        this.emit(id, $root)
      } catch (error) {
        warn('failure on saving task log in store', { error, taskLog })
      }
    },
  })

  constructor(app) {
    super()

    app.hooks
      .on('clean', () => this.#gc(app.config.getOptional('tasks.gc.keep') ?? 1e3))
      .on('start', async () => {
        this.#store = await app.getStore('tasks')

        for await (const taskLog of this.list({ filter: _ => _.status === 'pending' })) {
          taskLog.status = 'interrupted'
          await this.#store.put(taskLog.id, taskLog)
        }

        return () => this.#store.close()
      })
  }

  #gc(keep) {
    return new Promise((resolve, reject) => {
      const db = this.#store

      let count = 1

      const cb = () => {
        if (--count === 0) {
          resolve()
        }
      }
      const stream = db.createKeyStream({
        reverse: true,
      })

      const deleteEntry = key => {
        ++count
        db.del(key, cb)
      }

      const onData =
        keep !== 0
          ? () => {
              if (--keep === 0) {
                stream.on('data', deleteEntry)
                stream.removeListener('data', onData)
              }
            }
          : deleteEntry
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
    await this.#store.clear()
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
  create({ name, objectId, type }) {
    const tasks = this.#tasks

    const task = new Task({ data: { name, objectId, type }, onProgress: this.#onProgress })

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

    return task
  }

  async deleteLog(id) {
    await this.#store.del(id)
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

  async *list({ filter, limit = Infinity }) {
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
