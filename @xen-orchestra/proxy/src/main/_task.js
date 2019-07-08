import { Signal } from './_Signal'

class Task extends Promise {
  constructor(cancel, resolver) {
    super(resolver)
    this.cancel = cancel
  }
}

class Controller {
  get cancellation() {
    return this._cancellation
  }

  constructor(cancellation) {
    this._cancellation = cancellation
  }
}

const { push } = Array.prototype

export const wrap = fn =>
  function() {
    const cancellation = Signal.source()
    return new Task(cancellation.signal, resolve => {
      const args = [new Controller(cancellation.dispatch)]
      push.apply(args, arguments)
      resolve(fn.apply(this, args))
    })
  }
