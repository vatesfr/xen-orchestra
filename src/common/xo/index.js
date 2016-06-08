import asap from 'asap'
import assign from 'lodash/assign'
import cookies from 'cookies-js'
import isEqual from 'lodash/isEqual'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import once from 'lodash/once'
import React from 'react'
import fpSortBy from 'lodash/fp/sortBy'
import request from 'superagent'
import sortBy from 'lodash/sortBy'
import throttle from 'lodash/throttle'
import Xo from 'xo-lib'
import { createBackoff } from 'jsonrpc-websocket-client'
import { resolve } from 'url'

import _ from '../messages'
import { confirm } from '../modal'
import { info } from '../notification'
import { invoke, noop, tap } from '../utils'
import {
  connected,
  disconnected,
  signedIn,
  signedOut,
  updateObjects,
  updatePermissions
} from '../store/actions'

// ===================================================================

export const signOut = () => {
  cookies.expire('token')
  window.location.reload(true)
}

const xo = invoke(() => {
  const token = cookies.get('token')
  if (!token) {
    signOut()
    throw new Error('no valid token')
  }

  const xo = new Xo({
    credentials: { token }
  })

  const connect = () => {
    xo.open(createBackoff()).catch(error => {
      console.error('failed to connect to xo-server', error)
    })
  }
  connect()

  xo.on('scheduledAttempt', ({ delay }) => {
    console.log('next attempt in %s ms', delay)
  })

  xo.on('closed', connect)

  return xo
})

// ===================================================================

export const connectStore = store => {
  let updates = {}
  const sendUpdates = throttle(() => {
    store.dispatch(updateObjects(updates))
    updates = {}
  }, 5e2)

  xo.on('open', () => store.dispatch(connected()))
  xo.on('closed', () => {
    store.dispatch(signedOut())
    store.dispatch(disconnected())
  })
  xo.on('authenticated', () => {
    store.dispatch(signedIn(xo.user))

    xo.call('xo.getAllObjects').then(objects => store.dispatch(updateObjects(objects)))
  })
  xo.on('notification', notification => {
    if (notification.method !== 'all') {
      return
    }

    assign(updates, notification.params.items)
    sendUpdates()
  })
  subscribePermissions(permissions => store.dispatch(updatePermissions(permissions)))
}

// -------------------------------------------------------------------

export const resolveUrl = invoke(
  xo._url, // FIXME: accessing private prop
  baseUrl => to => resolve(baseUrl, to)
)

// -------------------------------------------------------------------

const _signIn = new Promise(resolve => xo.once('authenticated', resolve))

const createSubscription = cb => {
  const delay = 5e3

  const subscribers = Object.create(null)
  let cache
  let n = 0
  let nextId = 0
  let timeout

  let running = false

  const loop = () => {
    if (running) {
      return
    }

    running = true
    _signIn.then(() => cb()).then(result => {
      running = false
      timeout = setTimeout(loop, delay)

      if (!isEqual(result, cache)) {
        cache = result

        forEach(subscribers, subscriber => {
          subscriber(result)
        })
      }
    }, ::console.error)
  }

  const subscribe = cb => {
    const id = nextId++
    subscribers[id] = cb

    if (n++) {
      cache !== undefined && asap(() => cb(cache))
    } else {
      loop()
    }

    return once(() => {
      delete subscribers[id]

      if (!--n) {
        clearTimeout(timeout)
        cache = undefined
      }
    })
  }

  subscribe.forceRefresh = () => {
    if (n) {
      clearTimeout(timeout)
      loop()
    }
  }

  return subscribe
}

// Subscriptions -----------------------------------------------------

export const subscribeAcls = createSubscription(() => xo.call('acl.get'))

export const subscribeJobs = createSubscription(() => xo.call('job.getAll'))

export const subscribeJobsLogs = createSubscription(() => xo.call('log.get', {namespace: 'jobs'}))

export const subscribePermissions = createSubscription(() => xo.call('acl.getCurrentPermissions'))

export const subscribePlugins = createSubscription(() => xo.call('plugin.get'))

export const subscribeRemotes = createSubscription(() => xo.call('remote.getAll'))

export const subscribeResourceSets = createSubscription(() => xo.call('resourceSet.getAll'))

export const subscribeScheduleTable = createSubscription(() => xo.call('scheduler.getScheduleTable'))

export const subscribeSchedules = createSubscription(() => xo.call('schedule.getAll'))

export const subscribeServers = createSubscription(invoke(
  fpSortBy('host'),
  sort => () => xo.call('server.getAll').then(sort)
))

export const subscribeUsers = createSubscription(() => xo.call('user.getAll').then(users => {
  forEach(users, user => {
    user.type = 'user'
  })

  return sortBy(users, 'email')
}))

export const subscribeGroups = createSubscription(() => xo.call('group.getAll').then(groups => {
  forEach(groups, group => {
    group.type = 'group'
  })

  return sortBy(groups, 'name')
}))

export const subscribeRoles = createSubscription(invoke(
  sortBy('name'),
  sort => () => xo.call('role.getAll').then(sort)
))

// System ============================================================

export const serverVersion = _signIn.then(() => xo.call('system.getServerVersion'))

// ===================================================================

const resolveId = value =>
  (value != null && typeof value === 'object' && 'id' in value)
    ? value.id
    : value

const resolveIds = params => {
  for (const key in params) {
    const param = params[key]
    if (param != null && typeof param === 'object' && 'id' in param) {
      params[key] = param.id
    }
  }
  return params
}

// Server ------------------------------------------------------------

export const addServer = (host, username, password) => (
  xo.call('server.add', { host, username, password })::tap(
    subscribeServers.forceRefresh
  )
)

export const editServer = ({ id }, { host, username, password }) => (
  xo.call('server.set', { id, host, username, password })::tap(
    subscribeServers.forceRefresh
  )
)

export const connectServer = ({ id }) => (
  xo.call('server.connect', { id })::tap(
    subscribeServers.forceRefresh
  )
)

export const disconnectServer = ({ id }) => (
  xo.call('server.disconnect', { id })::tap(
    subscribeServers.forceRefresh
  )
)

export const removeServer = ({ id }) => (
  xo.call('server.remove', { id })::tap(
    subscribeServers.forceRefresh
  )
)

// Host --------------------------------------------------------------

export const editHost = ({ id }, props) => (
  xo.call('host.set', { ...props, id })
)

export const fetchHostStats = ({ id }, granularity) => (
  xo.call('host.stats', { host: id, granularity })
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

export const installHostPatch = ({ id }, { uuid }) => (
  xo.call('host.installPatch', { host: id, patch: uuid })
)

export const installAllHostPatches = ({ id }) => (
  xo.call('host.installAllPatches', { host: id })
)

// VM ----------------------------------------------------------------

export const startVm = ({ id }) => (
  xo.call('vm.start', { id })
)

export const startVms = vms => (
  confirm({
    title: _('startVmsModalTitle', { vms: vms.length }),
    body: _('startVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => startVm({ id: vmId })),
    noop
  )
)

export const stopVm = ({ id }, force = false) => (
  xo.call('vm.stop', { id, force })
)

export const stopVms = (vms, force) => (
  confirm({
    title: _('stopVmsModalTitle', { vms: vms.length }),
    body: _('stopVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => stopVm({ id: vmId }, force)),
    noop
  )
)

export const suspendVm = ({ id }) => (
  xo.call('vm.suspend', { id })
)

export const resumeVm = ({ id }) => (
  xo.call('vm.resume', { id })
)

export const recoveryStartVm = ({ id }) => (
  xo.call('vm.recoveryStart', { id })
)

export const restartVm = ({ id }, force = false) => (
  xo.call('vm.restart', { id, force })
)

export const restartVms = (vms, force) => (
  confirm({
    title: _('restartVmsModalTitle', { vms: vms.length }),
    body: _('restartVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => restartVm({ id: vmId }, force)),
    noop
  )
)

export const cloneVm = ({ id, name_label: nameLabel }, fullCopy = false) => (
  xo.call('vm.clone', {
    id,
    name: `${nameLabel}_clone`,
    full_copy: fullCopy
  })
)

export const convertVmToTemplate = ({ id }) => (
  confirm({
    title: 'Convert to template',
    body: <div>
      <p>Are you sure you want to convert this VM into a template?</p>
      <p>This operation is definitive.</p>
    </div>
  }).then(
    () => xo.call('vm.convert', { id }),
    noop
  )
)

export const snapshotVm = ({ id }) => (
  xo.call('vm.snapshot', { id })
)

export const snapshotVms = vms => (
  confirm({
    title: _('snapshotVmsModalTitle', { vms: vms.length }),
    body: _('snapshotVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => snapshotVm({ id: vmId })),
    noop
  )
)

import MigrateVmModalBody from './migrate-vm-modal'
export const migrateVm = (vm, host) => {
  let body
  if (!host) {
    body = <MigrateVmModalBody vm={vm} />
  } else {
    body = _('migrateVmModalBody', { hostName: host.name_label })
  }
  return confirm({
    title: _('migrateVmModalTitle'),
    body
  }).then(
    params => {
      if (!params && !host) {
        throw new Error('A target host is required to migrate a VM')
      }
      if (params) {
        xo.call('vm.migrate', { vm: vm.id, ...params })
      } else {
        xo.call('vm.migrate', { vm: vm.id, targetHost: host.id })
      }
    },
    noop
  )
}

export const migrateVms = vms => {
  throw new Error('Not implemented.')
}

export const deleteVm = ({ id }) => (
  confirm({
    title: _('deleteVmModalTitle'),
    body: _('deleteVmModalMessage')
  }).then(
    () => xo.call('vm.delete', { id, delete_disks: true }),
    noop
  )
)

export const deleteVms = vms => (
  confirm({
    title: _('deleteVmsModalTitle', { vms: vms.length }),
    body: _('deleteVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => xo.call('vm.delete', { id: vmId })),
    noop
  )
)

export const importBackup = ({remote, file, sr}) => (
  xo.call('vm.importBackup', {remote, file, sr})
)

export const importDeltaBackup = ({sr, remote, filePath}) => (
  xo.call('vm.importDeltaBackup', {sr, remote, filePath})
)

export const revertSnapshot = ({ id }) => (
  xo.call('vm.revert', { id })
)

export const editVm = ({ id }, props) => (
  xo.call('vm.set', { ...props, id })
)

export const fetchVmStats = ({ id }, granularity) => (
  xo.call('vm.stats', { id, granularity })
)

export const importVm = ({ sr, file }) => {
  const { name } = file

  info(_('startImport'), name)

  return xo.call('vm.import', { sr }).then(({ $sendTo: url }) => {
    const req = request.post(url)

    req.send(file)
    req.end((err, res) => {
      info(
        _((!err && res.status === 200)
          ? 'vmImportSuccess'
          : 'vmImportFailed'),
        name
      )
    })
  })
}

// VDI ---------------------------------------------------------------

export const editVdi = ({ id }, props) => (
  xo.call('vdi.set', { ...props, id })
)

export const deleteVdi = ({ id }) => (
  xo.call('vdi.delete', { id })
)

export const migrateVdi = (vdi, sr) => (
  xo.call('vdi.migrate', { id: vdi.id, sr_id: sr.id })
)

// VDB ---------------------------------------------------------------

export const connectVbd = ({ id }) => (
  xo.call('vbd.connect', { id })
)

export const disconnectVbd = ({ id }) => (
  xo.call('vbd.disconnect', { id })
)

export const deleteVbd = ({ id }) => (
  xo.call('vbd.delete', { id })
)

export const editVbd = ({ id }, props) => (
  xo.call('vbd.set', { ...props, id })
)

export const setBootableVbd = ({ id }, bootable) => (
  xo.call('vbd.setBootable', { vbd: id, bootable })
)

// Network -----------------------------------------------------------

export const editNetwork = ({ id }, props) => (
  xo.call('network.set', { ...props, id })
)

// SR ----------------------------------------------------------------

export const deleteSr = ({ id }) => (
  confirm({
    title: 'Delete SR',
    body: <div>
      <p>Are you sure you want to remove this SR?</p>
      <p>This operation is definitive, and ALL DISKS WILL BE LOST FOREVER.</p>
    </div>
  }).then(
    () => xo.call('sr.destroy', { id }),
    noop
  )
)

export const forgetSr = ({ id }) => (
  confirm({
    title: 'Forget SR',
    body: <div>
      <p>Are you sure you want to forget this SR?</p>
      <p>VDIs on this storage wont be removed.</p>
    </div>
  }).then(
    () => xo.call('sr.forget', { id }),
    noop
  )
)

export const reconnectAllHostsSr = ({ id }) => (
  confirm({
    title: 'Reconnect all hosts',
    body: <div>
      <p>This will reconnect this SR to all its hosts</p>
    </div>
  }).then(
    () => xo.call('sr.connectAllPbds', { id }),
    noop
  )
)

export const disconnectAllHostsSr = ({ id }) => (
  confirm({
    title: 'Disconnect all hosts',
    body: <div>
      <p>This will disconnect this SR to all its hosts</p>
    </div>
  }).then(
    () => xo.call('sr.disconnectAllPbds', { id }),
    noop
  )
)

export const editSr = ({ id }, props) => (
  xo.call('sr.set', { ...props, id })
)

export const rescanSr = ({ id }) => (
  xo.call('sr.scan', { id })
)

// PBDs --------------------------------------------------------------

export const connectPbd = ({ id }) => (
  xo.call('pbd.connect', { id })
)

export const disconnectPbd = ({ id }) => (
  xo.call('pbd.disconnect', { id })
)

export const deletePbd = ({ id }) => (
  xo.call('pbd.delete', { id })
)

// Messages ----------------------------------------------------------

export const deleteMessage = ({ id }) => (
  xo.call('message.delete', { id })
)

// Tags --------------------------------------------------------------

export const addTag = (id, tag) => (
  xo.call('tag.add', { id, tag })
)

export const removeTag = (id, tag) => (
  xo.call('tag.remove', { id, tag })
)

// Backups -----------------------------------------------------------

export const createSchedule = (jobId, cron, enabled) => (
  xo.call('schedule.create', { jobId, cron, enabled })::tap(
    subscribeSchedules.forceRefresh
  )
)

export const createJob = job => (
  xo.call('job.create', { job })::tap(
    subscribeJobs.forceRefresh
  )
)

export const runJob = id => {
  info(_('runJob'), _('runJobVerbose'))
  return xo.call('job.runSequence', { idSequence: [id] })
}

export const getJob = id => (
  xo.call('job.get', { id })
)

export const setJob = job => (
  xo.call('job.set', { job })::tap(
    subscribeJobs.forceRefresh
  )
)

export const enableSchedule = id => (
  xo.call('scheduler.enable', { id })::tap(
    subscribeScheduleTable.forceRefresh
  )
)

export const disableSchedule = id => (
  xo.call('scheduler.disable', { id })::tap(
    subscribeScheduleTable.forceRefresh
  )
)

export const deleteSchedule = async schedule => {
  await confirm({
    title: _('deleteJob'),
    body: _('deleteJobQuestion')
  })
  await xo.call('schedule.delete', { id: schedule.id })
  await xo.call('job.delete', { id: schedule.job })

  subscribeSchedules.forceRefresh()
}

// Plugins -----------------------------------------------------------

export const loadPlugin = async id => {
  try {
    await xo.call('plugin.load', { id })

    subscribePlugins.forceRefresh()
  } catch (error) {
    info(_('pluginError'), JSON.stringify(error.data) || _('unknownPluginError'))
  }
}

export const unloadPlugin = async id => {
  try {
    await xo.call('plugin.unload', { id })

    subscribePlugins.forceRefresh()
  } catch (error) {
    info(_('pluginError'), JSON.stringify(error.data) || _('unknownPluginError'))
  }
}

export const enablePluginAutoload = id => (
  xo.call('plugin.enableAutoload', { id })::tap(
    subscribePlugins.forceRefresh
  )
)

export const disablePluginAutoload = id => (
  xo.call('plugin.disableAutoload', { id })::tap(
    subscribePlugins.forceRefresh
  )
)

export const configurePlugin = async (id, configuration) => {
  try {
    await xo.call('plugin.configure', { id, configuration })
    info(_('pluginConfigurationSuccess'), _('pluginConfigurationChanges'))

    subscribePlugins.forceRefresh()
  } catch (error) {
    info(_('pluginError'), JSON.stringify(error.data) || _('unknownPluginError'))
    throw error
  }
}

export const purgePluginConfiguration = async id => {
  try {
    await confirm({
      title: _('purgePluginConfiguration'),
      body: _('purgePluginConfigurationQuestion')
    })
    await xo.call('plugin.purgeConfiguration', { id })

    subscribePlugins.forceRefresh()
  } catch (error) {
    throw error
  }
}

// Resource set ------------------------------------------------------

export const createResourceSet = (name, { subjects, objects, limits } = {}) => (
  xo.call('resourceSet.create', { name, subjects, objects, limits })::tap(
    subscribeResourceSets.forceRefresh
  )
)

export const editRessourceSet = (id, { name, subjects, objects, limits } = {}) => (
  xo.call('resourceSet.set', { id, name, subjects, objects, limits })::tap(
    subscribeResourceSets.forceRefresh
  )
)

export const deleteResourceSet = async id => {
  await confirm({
    title: _('deleteResourceSetWarning'),
    body: _('deleteResourceSetQuestion')
  })
  await xo.call('resourceSet.delete', { id })

  subscribeResourceSets.forceRefresh()
}

// Remote ------------------------------------------------------------

export const createRemote = (name, url) => (
  xo.call('remote.create', {name, url})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const deleteRemote = remote => (
  xo.call('remote.delete', {id: resolveId(remote)})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const enableRemote = remote => (
  xo.call('remote.set', {id: resolveId(remote), enabled: true})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const disableRemote = id => (
  xo.call('remote.set', {id, enabled: false})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const editRemote = (remote, {name, url}) => (
  xo.call('remote.set', resolveIds({remote, name, url}))::tap(
    subscribeRemotes.forceRefresh
  )
)

export const listRemote = id => (
  xo.call('remote.list', {id})::tap(
    subscribeRemotes.forceRefresh
  )
)

// -------------------------------------------------------------------

export const probeSrNfs = (host, server) => (
  xo.call('sr.probeNfs', {host, server})
)

export const probeSrNfsExists = (host, server, serverPath) => (
  xo.call('sr.probeNfsExists', {host, server, serverPath})
)

export const probeSrIscsiIqns = (host, target, port = undefined, chapUser = undefined, chapPassword) => {
  const params = {host, target}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return xo.call('sr.probeIscsiIqns', params)
}

export const probeSrIscsiLuns = (host, target, targetIqn, chapUser = undefined, chapPassword) => {
  const params = {host, target, targetIqn}
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return xo.call('sr.probeIscsiLuns', params)
}

export const probeSrIscsiExists = (host, target, targetIqn, scsiId, port = undefined, chapUser = undefined, chapPassword) => {
  const params = {host, target, targetIqn, scsiId}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return xo.call('sr.probeIscsiExists', params)
}

export const reattachSr = (host, uuid, nameLabel, nameDescription, type) => (
  xo.call('sr.reattach', {host, uuid, nameLabel, nameDescription, type})
)

export const reattachSrIso = (host, uuid, nameLabel, nameDescription, type) => (
  xo.call('sr.reattachIso', {host, uuid, nameLabel, nameDescription, type})
)

export const createSrNfs = (host, nameLabel, nameDescription, server, serverPath, nfsVersion = undefined) => {
  const params = {host, nameLabel, nameDescription, server, serverPath}
  nfsVersion && (params.nfsVersion = nfsVersion)
  return xo.call('sr.createNfs', params)
}

export const createSrIscsi = (host, nameLabel, nameDescription, target, targetIqn, scsiId, port = undefined, chapUser = undefined, chapPassword = undefined) => {
  const params = {host, nameLabel, nameDescription, target, targetIqn, scsiId}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return xo.call('sr.createIscsi', params)
}

export const createSrIso = (host, nameLabel, nameDescription, path, type, user = undefined, password = undefined) => {
  const params = {host, nameLabel, nameDescription, path, type}
  user && (params.user = user)
  password && (params.password = password)
  return xo.call('sr.createIso', params)
}

export const createSrLvm = (host, nameLabel, nameDescription, device) => (
  xo.call('sr.createLvm', {host, nameLabel, nameDescription, device})
)

// Job logs ----------------------------------------------------------

export const deleteJobsLog = id => (
  xo.call('log.delete', {namespace: 'jobs', id})::tap(
    subscribeJobsLogs.forceRefresh
  )
)

// Acls, users, groups ----------------------------------------------------------

export const addAcl = ({subject, object, action}) => (
  xo.call('acl.add', resolveIds({subject, object, action}))::tap(
    subscribeAcls.forceRefresh
  )
)

export const removeAcl = ({subject, object, action}) => (
  xo.call('acl.remove', resolveIds({subject, object, action}))::tap(
    subscribeAcls.forceRefresh
  )
)

export const createGroup = name => (
  xo.call('group.create', {name})::tap(
    subscribeGroups.forceRefresh
  )
)

export const setGroupName = (group, name) => (
  xo.call('group.set', resolveIds({group, name}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const deleteGroup = group => (
  xo.call('group.delete', resolveIds({id: group}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const removeUserFromGroup = (user, group) => (
  xo.call('group.removeUser', resolveIds({id: group, userId: user}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const addUserToGroup = (user, group) => (
  xo.call('group.addUser', resolveIds({id: group, userId: user}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const createUser = (email, password, permission) => (
  xo.call('user.create', {email, password, permission})::tap(
    subscribeUsers.forceRefresh
  )
)

export const deleteUser = user => (
  xo.call('user.delete', resolveIds({id: user}))::tap(
    subscribeUsers.forceRefresh
  )
)

export const editUser = (user, { email, password, permission }) => (
  xo.call('user.set', { id: resolveId(user), email, password, permission })::tap(
    subscribeUsers.forceRefresh
  )
)
