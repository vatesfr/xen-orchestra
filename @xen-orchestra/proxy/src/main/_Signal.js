function dispatch() {
  if (this._dispatched) {
    return
  }

  this._dispatched = true

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
  const dispatch_ = (this.dispatch = dispatch.bind(
    (this.signal = new Signal(INTERNAL))
  ))

  if (signals === undefined) {
    return
  }

  const n = signals.length
  for (let i = 0; i < n; ++i) {
    if (signals[i].dispatched) {
      dispatch_()
      return
    }
  }
  for (let i = 0; i < n; ++i) {
    signals[i].addListener(dispatch_)
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

export class Signal {
  static source(signals) {
    return new Source(signals)
  }

  constructor(executor) {
    this._listeners = undefined
    this._promise = undefined
    this._dispatched = false
    this._resolve = undefined

    if (executor !== INTERNAL) {
      executor(dispatch.bind(this))
    }
  }

  get description() {
    return this._description
  }

  get dispatched() {
    return this._dispatched
  }

  throwIfDispatched() {
    if (this._dispatched) {
      throw new Error('this signal has been dispatched')
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
      const dispatched = this._dispatched
      promise = this._promise = dispatched
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
    if (this._dispatched) {
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
