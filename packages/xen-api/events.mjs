const EVENT_TIMEOUT = 60e3

export class Watcher {
  #abortController
  #typeWatchers = new Map()
  classes = new Map()
  xapi

  constructor(xapi) {
    this.xapi = xapi
  }

  async asyncCall(method, params, { signal }) {
    const taskRef = await this.xapi.call('Async.' + method, params, { signal })

    return new Promise((resolve, reject) => {
      const stop = this.watch(
        'task',
        taskRef,
        task => {
          const { status } = task
          if (status === 'success') {
            stop()
            resolve(task.status)
          } else if (status === 'cancelled' || status === 'failure') {
            stop()
            reject(task.error_info)
          }
        },
        { signal }
      )
    })
  }

  async #start() {
    const { xapi } = this
    const { signal } = this.#abortController
    const watchers = this.#typeWatchers

    let token = await xapi.call('event.inject', 'pool', xapi.pool.$ref)

    while (true) {
      signal.throwIfRequested()

      const result = await xapi.call({ signal }, 'event.from', this.classes, token, EVENT_TIMEOUT)

      for (const event of result.events) {
      }
    }
    this.#abortController = undefined
  }

  start() {
    if (this.#abortController !== undefined) {
      throw new Error('already started')
    }

    this.#abortController = new AbortController()
    this.#start()
  }

  stop() {
    if (this.#abortController === undefined) {
      throw new Error('already stopped')
    }

    this.#abortController.abort()
  }
}

export class Cache {
  // contains records indexed by type + ref
  //
  // plain records when retrieved by events
  //
  // promises to record when retrieved by a get_record call (might be a rejection if the record does not exist)
  #recordCache = new Map()
  #watcher

  constructor(watcher) {
    this.#watcher = watcher
  }

  async #get(type, ref) {
    let record
    try {
      record = await this.#watcher.xapi.call(`${type}.get_record`, ref)
    } catch (error) {
      if (error.code !== 'HANDLE_INVALID') {
        throw error
      }
      record = Promise.reject(error)
    }
    this.#recordCache.set(type, Promise.resolve(record))
    return record
  }

  async get(type, ref) {
    const cache = this.#recordCache
    const key = type + ref

    let record = cache.get(key)
    if (record === undefined) {
      record = this.#get(type, ref)
      cache.set(key, record)
    }

    return record
  }

  async getByUuid(type, uuid) {
    return this.get(type, await this.#watcher.xapi.call(`${type}.get_by_uuid`, uuid))
  }
}
exports.Cache = Cache
