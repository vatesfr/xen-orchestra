'use strict'

const assert = require('node:assert').strict
const { AsyncLocalStorage } = require('node:async_hooks')

// define a read-only, non-enumerable, non-configurable property
function define(object, property, value) {
  Object.defineProperty(object, property, { value })
}

const noop = Function.prototype

const ABORTED = 'aborted'
const FAILURE = 'failure'
const PENDING = 'pending'
const SUCCESS = 'success'
exports.STATUS = { ABORTED, FAILURE, PENDING, SUCCESS }

// stored in the global context so that various versions of the library can interact.
const asyncStorageKey = '@vates/task@0'
const asyncStorage = global[asyncStorageKey] ?? (global[asyncStorageKey] = new AsyncLocalStorage())

const getTask = () => asyncStorage.getStore()

exports.Task = class Task {
  static get abortSignal() {
    const task = getTask()
    if (task !== undefined) {
      return task.#abortController.signal
    }
  }

  static info(message, data) {
    const task = getTask()
    if (task !== undefined) {
      task.#emit('info', { data, message })
    }
  }

  static run(opts, fn) {
    return new this(opts).run(fn)
  }

  static set(name, value) {
    const task = getTask()
    if (task !== undefined) {
      task.#emit('property', { name, value })
    }
  }

  static warning(message, data) {
    const task = getTask()
    if (task !== undefined) {
      task.#emit('warning', { data, message })
    }
  }

  static wrap(opts, fn) {
    // compatibility with @decorateWith
    if (typeof fn !== 'function') {
      ;[fn, opts] = [opts, fn]
    }

    return function taskRun() {
      return Task.run(typeof opts === 'function' ? opts.apply(this, arguments) : opts, () => fn.apply(this, arguments))
    }
  }

  #abortController = new AbortController()
  #onProgress

  get id() {
    return (this.id = Math.random().toString(36).slice(2))
  }
  set id(value) {
    define(this, 'id', value)
  }

  #startData

  #status = PENDING
  get status() {
    return this.#status
  }

  constructor({ data = {}, onProgress } = {}) {
    this.#startData = data

    if (onProgress !== undefined) {
      this.#onProgress = onProgress
    } else {
      const parent = getTask()
      if (parent !== undefined) {
        const { signal } = parent.#abortController
        signal.addEventListener('abort', () => {
          this.#abortController.abort(signal.reason)
        })

        this.#onProgress = parent.#onProgress
        this.#startData.parentId = parent.id
      } else {
        this.#onProgress = noop
      }
    }

    const { signal } = this.#abortController
    signal.addEventListener('abort', () => {
      if (this.status === PENDING && !this.#running) {
        this.#maybeStart()

        const status = ABORTED
        this.#status = status
        this.#emit('end', { result: signal.reason, status })
      }
    })
  }

  abort(reason) {
    this.#abortController.abort(reason)
  }

  #emit(type, data) {
    data.id = this.id
    data.timestamp = Date.now()
    data.type = type
    this.#onProgress(data)
  }

  #maybeStart() {
    const startData = this.#startData
    if (startData !== undefined) {
      this.#startData = undefined
      this.#emit('start', startData)
    }
  }

  async run(fn) {
    const result = await this.runInside(fn)
    if (this.status === PENDING) {
      this.#status = SUCCESS
      this.#emit('end', { status: SUCCESS, result })
    }
    return result
  }

  #running = false
  async runInside(fn) {
    assert.equal(this.status, PENDING)
    assert.equal(this.#running, false)
    this.#running = true

    this.#maybeStart()

    try {
      const result = await asyncStorage.run(this, fn)
      this.#running = false
      return result
    } catch (result) {
      const { signal } = this.#abortController
      const aborted = signal.aborted && result === signal.reason
      const status = aborted ? ABORTED : FAILURE

      this.#status = status
      this.#emit('end', { status, result })
      throw result
    }
  }

  wrap(fn) {
    const task = this
    return function taskRun() {
      return task.run(() => fn.apply(this, arguments))
    }
  }

  wrapInside(fn) {
    const task = this
    return function taskRunInside() {
      return task.runInside(() => fn.apply(this, arguments))
    }
  }
}
