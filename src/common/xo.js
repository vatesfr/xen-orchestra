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
const createSubscription = (name, cb) => {
  const delay = 5e3

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

createSubscription('permissions', () => xo.call('acl.getCurrentPermissions'))

createSubscription('servers', invoke(
  sortBy('host'),
  (sort) => () => xo.call('server.getAll').then(sort)
))

createSubscription('users', invoke(
  sortBy('email'),
  (sort) => () => xo.call('user.getAll').then(sort)
))

export const subscribe = (what, cb) => subscriptions[what](cb)

// ===================================================================

export const addServer = (host, username, password) => (
  xo.call('server.add', { host, username, password })
)

export const editServer = ({ id }, { host, username, password }) => (
  xo.call('server.set', { id, host, username, password })
)

// -------------------------------------------------------------------

export const editHost = ({ id }, props) => (
  xo.call('host.set', { ...props, id })
)

export const restartHost = ({ id }, force = false) => (
  xo.call('host.restart', { id, force })
)

export const restartHostAgent = ({ id }) => (
  xo.call('host.restart_agent', { id })
)

export const startHost = ({ id }) => (
  xo.call('host.start', { id })
)

export const stopHost = ({ id }) => (
  xo.call('host.stop', { id })
)

export const enableHost = ({ id }) => (
  xo.call('host.enable', { id })
)

export const disableHost = ({ id }) => (
  xo.call('host.disable', { id })
)

export const getHostMissingPatches = ({ id }) => (
  xo.call('host.listMissingPatches', { host: id })
)

export const emergencyShutdownHost = ({ id }) => (
  xo.call('host.emergencyShutdownHost', { host: id })
)

export const installAllHostPatches = ({ id }) => (
  xo.call('host.installAllPatches', { host: id })
)

// -------------------------------------------------------------------

export const startVm = ({ id }) => (
  xo.call('vm.start', { id })
)

export const stopVm = ({ id }, force = false) => (
  xo.call('vm.stop', { id, force })
)

export const suspendVm = ({ id }) => (
  xo.call('vm.suspend', { id })
)

export const resumeVm = ({ id }) => (
  xo.call('vm.resume', { id })
)

export const restartVm = ({ id }, force = false) => (
  xo.call('vm.restart', { id, force })
)

export const cloneVm = ({ id }, fullCopy = false) => (
  xo.call('vm.clone', { id, full_copy: fullCopy })
)

export const convertVm = ({ id }) => (
  xo.call('vm.convert', { id })
)

export const snapshotVm = ({ id, name_label }) => (
  xo.call('vm.snapshot', {
    id,
    name: `${name_label}_${new Date().toISOString()}`
  })
)

export const deleteVm = ({ id }, force = true) => (
  xo.call('vm.delete', { id, force })
)

export const revertSnapshot = ({ id }) => (
  xo.call('vm.revert', { id })
)

export const editVm = ({ id }, props) => (
  xo.call('vm.set', { ...props, id })
)
// -------------------------------------------------------------------

export const deleteMessage = ({ id }) => (
  xo.call('message.delete', { id })
)

// -------------------------------------------------------------------

export const addTag = (id, tag) => (
  xo.call('tag.add', { id, tag })
)

export const removeTag = (id, tag) => (
  xo.call('tag.add', { id, tag })
)
