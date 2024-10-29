'use strict'

const assert = require('node:assert').strict
const { AsyncLocalStorage } = require('node:async_hooks')

function alreadyEnded() {
  throw new Error('task has already ended')
}

// define a read-only, non-enumerable, non-configurable property
function define(object, property, value) {
  Object.defineProperty(object, property, { value })
}

const noop = Function.prototype

const FAILURE = 'failure'
const PENDING = 'pending'
const SUCCESS = 'success'
exports.STATUS = { FAILURE, PENDING, SUCCESS }

// stored in the global context so that various versions of the library can interact.
const asyncStorageKey = '@vates/task@0'
const asyncStorage = global[asyncStorageKey] ?? (global[asyncStorageKey] = new AsyncLocalStorage())

const getTask = () => asyncStorage.getStore()

class Task {
  static get abortSignal() {
    const task = getTask()
    if (task !== undefined) {
      return task.#abortController.signal
    }
  }

  static run(...args) {
    let opts = args[0]
    let fn
    if (typeof opts === 'object') {
      args.shift()
      fn = args[0]
    } else {
      fn = opts
      opts = undefined
    }
    args.shift()

    const thisArg = this !== Task ? this : undefined

    if (typeof fn !== 'function') {
      fn = this[fn]
    }

    return new Task(opts).run(() => fn.apply(thisArg, args))
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

  constructor({ properties, onProgress } = {}) {
    this.#startData = { properties }

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
      if (this.status === PENDING) {
        this.#maybeStart()

        this.#emit('abortionRequested', { reason: signal.reason })

        if (!this.#running) {
          this.#end(FAILURE, signal.reason)
        }
      }
    })
  }

  abort(reason) {
    this.#abortController.abort(reason)
  }

  #emit(type, data) {
    assert.equal(this.#startData, undefined, 'task has not started yet')

    data.id = this.id
    data.timestamp = Date.now()
    data.type = type
    this.#onProgress(data)
  }

  #end(status, result) {
    assert.equal(this.#status, PENDING)
    assert.equal(this.#running, false)

    this.#emit('end', { status, result })
    this.#onProgress = alreadyEnded
    this.#status = status
  }

  failure(error) {
    this.#end(FAILURE, error)
  }

  info(message, data) {
    this.#emit('info', { data, message })
  }

  #maybeStart() {
    if (this.#startData !== undefined) {
      this.start()
    }
  }

  async run(fn) {
    const result = await this.runInside(fn)
    if (this.status === PENDING) {
      this.#end(SUCCESS, result)
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
      const result = await asyncStorage.run(this, fn, this)
      this.#running = false
      return result
    } catch (result) {
      this.#running = false
      this.#end(FAILURE, result)
      throw result
    }
  }

  set(name, value) {
    assert.equal(this.status, PENDING)

    this.#emit('property', { name, value })
  }

  start() {
    const startData = this.#startData
    assert.notEqual(startData, undefined, 'task has already started')

    this.#startData = undefined
    this.#emit('start', startData)
  }

  success(result) {
    this.#end(SUCCESS, result)
  }

  warning(message, data) {
    assert.equal(this.status, PENDING)

    this.#emit('warning', { data, message })
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
exports.Task = Task

// setup static aliases
for (const name of ['info', 'set', 'warning']) {
  const method = Task.prototype[name]
  Task[name] = function () {
    const task = getTask()
    if (task !== undefined) {
      return method.apply(task, arguments)
    }
  }
}
