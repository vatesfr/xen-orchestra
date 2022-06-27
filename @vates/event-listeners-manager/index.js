'use strict'

exports.EventListenersManager = class EventListenersManager {
  constructor(emitter) {
    this._listeners = new Map()

    this._add = (emitter.addListener || emitter.addEventListener).bind(emitter)
    this._remove = (emitter.removeListener || emitter.removeEventListener).bind(emitter)
  }

  add(type, listener) {
    let listeners = this._listeners.get(type)
    if (listeners === undefined) {
      listeners = new Set()
      this._listeners.set(type, listeners)
    }

    // don't add the same listener multiple times (allowed on Node.js)
    if (!listeners.has(listener)) {
      listeners.add(listener)
      this._add(type, listener)
    }

    return this
  }

  remove(type, listener) {
    const allListeners = this._listeners
    const listeners = allListeners.get(type)
    if (listeners !== undefined && listeners.delete(listener)) {
      this._remove(type, listener)
      if (listeners.size === 0) {
        allListeners.delete(type)
      }
    }

    return this
  }

  removeAll(type) {
    const allListeners = this._listeners
    const remove = this._remove
    const types = type !== undefined ? [type] : allListeners.keys()
    for (const type of types) {
      const listeners = allListeners.get(type)
      if (listeners !== undefined) {
        allListeners.delete(type)
        for (const listener of listeners) {
          remove(type, listener)
        }
      }
    }

    return this
  }
}
