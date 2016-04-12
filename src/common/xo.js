import forEach from 'lodash/forEach'
import once from 'lodash/once'
import sortBy from 'lodash/fp/sortBy'
import Xo from 'xo-lib'
import { invoke } from 'utils'
import { resolve } from 'url'

// ===================================================================

const xo = new Xo()
export { xo as default }

// -------------------------------------------------------------------

const baseUrl = xo._url // FIXME
export const resolveUrl = (to) => resolve(baseUrl, to)

// -------------------------------------------------------------------

const subscriptions = Object.create(null)
const createSubscription = (name, cb, delay = 5e3) => {
  const subscribers = Object.create(null)
  let n = 0
  let nextId = 0
  let timeout

  const loop = () => {
    new Promise((resolve) => resolve(cb())).then((result) => {
      forEach(subscribers, (subscriber) => {
        subscriber(result)
      })

      timeout = setTimeout(loop, delay)
    }, ::console.error)
  }

  subscriptions[name] = (cb) => {
    const id = nextId++
    subscribers[id] = cb

    if (!n++) {
      loop()
    }

    return once(() => {
      delete subscribers[id]

      if (!--n) {
        clearTimeout(timeout)
      }
    })
  }
}

createSubscription('servers', invoke(
  sortBy('host'),
  (sort) => () => xo.call('server.getAll').then(sort)
))

export const subscribe = (what, cb) => subscriptions[what](cb)

// ===================================================================

export const addServer = (host, username, password) => (
  xo.call('server.add', { host, username, password })
)

export const editServer = (id, { host, username, password }) => (
  xo.call('server.set', { id, host, username, password })
)
