function fulfilledThen(cb) {
  return typeof cb === 'function' ? SyncThenable.fromFunction(cb, this.value) : this
}

function rejectedThen(_, cb) {
  return typeof cb === 'function' ? SyncThenable.fromFunction(cb, this.value) : this
}

export class SyncThenable {
  static resolve(value) {
    if (value != null && typeof value.then === 'function') {
      return value
    }

    return new this(false, value)
  }

  static fromFunction(fn, ...arg) {
    try {
      return this.resolve(fn(...arg))
    } catch (error) {
      return this.reject(error)
    }
  }

  static reject(reason) {
    return new this(true, reason)
  }

  // unwrap if it's a SyncThenable
  static tryUnwrap(value) {
    if (value instanceof this) {
      if (value.then === rejectedThen) {
        throw value.value
      }
      return value.value
    }
    return value
  }

  constructor(rejected, value) {
    this.then = rejected ? rejectedThen : fulfilledThen
    this.value = value
  }
}
