function request() {
  if (this._requested) {
    return
  }

  this._requested = true

  const resolve = this._resolve
  if (resolve !== undefined) {
    this._resolve = undefined
    resolve()
  }

  const listeners = this._listeners
  if (listeners !== undefined) {
    this._listeners = undefined
    for (let i = 0, n = listeners.length; i < n; ++i) {
      listeners[i].call(this)
    }
  }
}

const INTERNAL = {}

function Source(signals) {
  const request_ = (this.request = request.bind(
    (this.signal = new Signal(INTERNAL))
  ))

  if (signals === undefined) {
    return
  }

  const n = signals.length
  for (let i = 0; i < n; ++i) {
    if (signals[i].requested) {
      request_()
      return
    }
  }
  for (let i = 0; i < n; ++i) {
    signals[i].addListener(request_)
  }
}

class Subscription {
  constructor(signal, listener) {
    this._listener = listener
    this._signal = signal
  }

  get closed() {
    return this._signal === undefined
  }

  unsubscribe() {
    const signal = this._signal
    if (signal !== undefined) {
      const listener = this._listener
      this._listener = this._signal = undefined

      const listeners = signal._listeners
      if (listeners !== undefined) {
        const i = listeners.indexOf(listener)
        if (i !== -1) {
          listeners.splice(i, 1)
        }
      }
    }
  }
}
const closedSubscription = new Subscription()

export default class Signal {
  static source(signals) {
    return new Source(signals)
  }

  constructor(executor) {
    this._listeners = undefined
    this._promise = undefined
    this._requested = false
    this._resolve = undefined

    if (executor !== INTERNAL) {
      executor(request.bind(this))
    }
  }

  get description() {
    return this._description
  }

  get requested() {
    return this._requested
  }

  throwIfRequested() {
    if (this._requested) {
      throw new Error('this signal has been requested')
    }
  }

  // ===========================================================================
  // Promise like API
  // ===========================================================================

  then(listener) {
    if (typeof listener !== 'function') {
      return this
    }

    let promise = this._promise
    if (promise === undefined) {
      const requested = this._requested
      promise = this._promise = requested
        ? Promise.resolve()
        : new Promise(resolve => {
            this._resolve = resolve
          })
    }
    return promise.then(listener)
  }

  // ===========================================================================
  // Observable like API (but not compatible)
  // ===========================================================================

  subscribe(listener) {
    if (this._requested) {
      listener.call(this)
      return closedSubscription
    }
    const listeners = this._listeners
    if (listeners === undefined) {
      this._listeners = [listener]
    } else {
      listeners.push(listener)
    }
    return new Subscription(this, listener)
  }
}
