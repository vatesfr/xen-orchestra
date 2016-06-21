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
import logError from '../log-error'
import { confirm } from '../modal'
import { error, info } from '../notification'
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
      logError(error, 'failed to connect to xo-server')
    })
  }
  connect()

  xo.on('scheduledAttempt', ({ delay }) => {
    console.warn('next attempt in %s ms', delay)
  })

  xo.on('closed', connect)

  return xo
})

const call = (method, params) => {
  let promise = xo.call(method, params)

  if (process.env.NODE_ENV !== 'production') {
    promise = promise.catch(error => {
      console.error('XO error', {
        method,
        params,
        code: error.code,
        message: error.message,
        data: error.data
      })

      throw error
    })
  }

  return promise
}

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

    call('xo.getAllObjects').then(objects => store.dispatch(updateObjects(objects)))
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

export const subscribeAcls = createSubscription(() => call('acl.get'))

export const subscribeJobs = createSubscription(() => call('job.getAll'))

export const subscribeJobsLogs = createSubscription(() => call('log.get', {namespace: 'jobs'}))

export const subscribePermissions = createSubscription(() => call('acl.getCurrentPermissions'))

export const subscribePlugins = createSubscription(() => call('plugin.get'))

export const subscribeRemotes = createSubscription(() => call('remote.getAll'))

export const subscribeResourceSets = createSubscription(() => call('resourceSet.getAll'))

export const subscribeScheduleTable = createSubscription(() => call('scheduler.getScheduleTable'))

export const subscribeSchedules = createSubscription(() => call('schedule.getAll'))

export const subscribeServers = createSubscription(invoke(
  fpSortBy('host'),
  sort => () => call('server.getAll').then(sort)
))

export const subscribeUsers = createSubscription(() => call('user.getAll').then(users => {
  forEach(users, user => {
    user.type = 'user'
  })

  return sortBy(users, 'email')
}))

export const subscribeGroups = createSubscription(() => call('group.getAll').then(groups => {
  forEach(groups, group => {
    group.type = 'group'
  })

  return sortBy(groups, 'name')
}))

export const subscribeRoles = createSubscription(invoke(
  sortBy('name'),
  sort => () => call('role.getAll').then(sort)
))

// System ============================================================

export const serverVersion = _signIn.then(() => call('system.getServerVersion'))

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
  call('server.add', { host, username, password })::tap(
    subscribeServers.forceRefresh
  )
)

export const editServer = ({ id }, { host, username, password, readOnly }) => (
  call('server.set', { id, host, username, password, readOnly })::tap(
    subscribeServers.forceRefresh
  )
)

export const connectServer = ({ id }) => (
  call('server.connect', { id })::tap(
    subscribeServers.forceRefresh
  )
)

export const disconnectServer = ({ id }) => (
  call('server.disconnect', { id })::tap(
    subscribeServers.forceRefresh
  )
)

export const removeServer = ({ id }) => (
  call('server.remove', { id })::tap(
    subscribeServers.forceRefresh
  )
)

// Host --------------------------------------------------------------

export const editHost = ({ id }, props) => (
  call('host.set', { ...props, id })
)

export const fetchHostStats = ({ id }, granularity) => (
  call('host.stats', { host: id, granularity })
)

export const restartHost = ({ id }, force = false) => (
  call('host.restart', { id, force })
)

export const restartHostAgent = ({ id }) => (
  call('host.restart_agent', { id })
)

export const startHost = ({ id }) => (
  call('host.start', { id })
)

export const stopHost = ({ id }) => (
  call('host.stop', { id })
)

export const enableHost = ({ id }) => (
  call('host.enable', { id })
)

export const disableHost = ({ id }) => (
  call('host.disable', { id })
)

export const getHostMissingPatches = ({ id }) => (
  call('host.listMissingPatches', { host: id })
)

export const emergencyShutdownHost = ({ id }) => (
  call('host.emergencyShutdownHost', { host: id })
)

export const installHostPatch = ({ id }, { uuid }) => (
  call('host.installPatch', { host: id, patch: uuid })
)

export const installAllHostPatches = ({ id }) => (
  call('host.installAllPatches', { host: id })
)

// VM ----------------------------------------------------------------

export const startVm = ({ id }) => (
  call('vm.start', { id })
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
  call('vm.stop', { id, force })
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
  call('vm.suspend', { id })
)

export const resumeVm = ({ id }) => (
  call('vm.resume', { id })
)

export const recoveryStartVm = ({ id }) => (
  call('vm.recoveryStart', { id })
)

export const restartVm = ({ id }, force = false) => (
  call('vm.restart', { id, force })
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
  call('vm.clone', {
    id,
    name: `${nameLabel}_clone`,
    full_copy: fullCopy
  })
)

import CopyVmModalBody from './copy-vm-modal'
export const copyVm = (vm, sr, name, compress) => {
  if (sr) {
    return confirm({
      title: _('copyVm'),
      body: _('copyVmConfirm', { SR: sr.name_label })
    }).then(() => call('vm.copy', { vm: vm.id, sr: sr.id, name: name || vm.name_label + '_COPY', compress }))
  } else {
    return confirm({
      title: _('copyVm'),
      body: <CopyVmModalBody vm={vm} />
    }).then(
      params => call('vm.copy', { vm: vm.id, ...params }),
      noop
    )
  }
}

export const convertVmToTemplate = ({ id }) => (
  confirm({
    title: 'Convert to template',
    body: <div>
      <p>Are you sure you want to convert this VM into a template?</p>
      <p>This operation is definitive.</p>
    </div>
  }).then(
    () => call('vm.convert', { id }),
    noop
  )
)

export const snapshotVm = ({ id }) => (
  call('vm.snapshot', { id })
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
        call('vm.migrate', { vm: vm.id, ...params })
      } else {
        call('vm.migrate', { vm: vm.id, targetHost: host.id })
      }
    },
    noop
  )
}

export const migrateVms = vms => {
  throw new Error('Not implemented.')
}

export const createVm = args => (
  call('vm.create', args)
)

export const getCloudInitConfig = template => (
  call('vm.getCloudInitConfig', { template })
)

export const deleteVm = ({ id }) => (
  confirm({
    title: _('deleteVmModalTitle'),
    body: _('deleteVmModalMessage')
  }).then(
    () => call('vm.delete', { id, delete_disks: true }),
    noop
  )
)

export const deleteVms = vms => (
  confirm({
    title: _('deleteVmsModalTitle', { vms: vms.length }),
    body: _('deleteVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => call('vm.delete', { id: vmId })),
    noop
  )
)

export const importBackup = ({remote, file, sr}) => (
  call('vm.importBackup', {remote, file, sr})
)

export const importDeltaBackup = ({sr, remote, filePath}) => (
  call('vm.importDeltaBackup', {sr, remote, filePath})
)

export const revertSnapshot = ({ id }) => (
  call('vm.revert', { id })
)

export const editVm = ({ id }, props) => (
  call('vm.set', { ...props, id })
)

export const fetchVmStats = ({ id }, granularity) => (
  call('vm.stats', { id, granularity })
)

export const importVm = (file, sr) => {
  const { name } = file

  info(_('startVmImport'), name)

  return call('vm.import', { sr }).then(({ $sendTo: url }) => {
    const req = request.post(url)

    req.send(file)
    req.end((err, res) => {
      if (!err && res.status === 200) {
        info(_('vmImportSuccess'), name)
      } else {
        error(_('vmImportFailed'), name)
      }
    })
  })
}

export const importVms = (files, sr) => (
  Promise.all(map(files, file =>
    importVm(file, sr).catch(noop)
  ))
)

export const exportVm = ({ id }) => {
  info(_('startVmExport'), id)
  return call('vm.export', { vm: id })
    .then(({ $getFrom: url }) => window.open(`.${url}`))
}

export const insertCd = (vm, cd, force = false) => (
  call('vm.insertCd', {
    id: resolveId(vm),
    cd_id: resolveId(cd),
    force
  })
)

export const ejectCd = vm => (
  call('vm.ejectCd', { id: resolveId(vm) })
)

export const setVmBootOrder = (vm, order) => (
  xo.call('vm.setBootOrder', {
    vm: resolveId(vm),
    order
  })
)

export const attachDiskToVm = (vdi, vm, {bootable, mode, position}) => (
  xo.call('vm.attachDisk', {
    bootable,
    mode,
    position: position && String(position) || undefined,
    vdi: resolveId(vdi),
    vm: resolveId(vm)
  })
)

// DISK ---------------------------------------------------------------

export const createDisk = (name, size, sr) => (
  xo.call('disk.create', {
    name,
    size,
    sr: resolveId(sr)
  })
)

// VDI ---------------------------------------------------------------

export const editVdi = ({ id }, props) => (
  call('vdi.set', { ...props, id })
)

export const deleteVdi = ({ id }) => (
  call('vdi.delete', { id })
)

export const migrateVdi = (vdi, sr) => (
  call('vdi.migrate', { id: vdi.id, sr_id: sr.id })
)

// VDB ---------------------------------------------------------------

export const connectVbd = ({ id }) => (
  call('vbd.connect', { id })
)

export const disconnectVbd = ({ id }) => (
  call('vbd.disconnect', { id })
)

export const deleteVbd = ({ id }) => (
  call('vbd.delete', { id })
)

export const editVbd = ({ id }, props) => (
  call('vbd.set', { ...props, id })
)

export const setBootableVbd = ({ id }, bootable) => (
  call('vbd.setBootable', { vbd: id, bootable })
)

// Network -----------------------------------------------------------

export const editNetwork = ({ id }, props) => (
  call('network.set', { ...props, id })
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
    () => call('sr.destroy', { id }),
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
    () => call('sr.forget', { id }),
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
    () => call('sr.connectAllPbds', { id }),
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
    () => call('sr.disconnectAllPbds', { id }),
    noop
  )
)

export const editSr = ({ id }, props) => (
  call('sr.set', { ...props, id })
)

export const rescanSr = ({ id }) => (
  call('sr.scan', { id })
)

// PBDs --------------------------------------------------------------

export const connectPbd = ({ id }) => (
  call('pbd.connect', { id })
)

export const disconnectPbd = ({ id }) => (
  call('pbd.disconnect', { id })
)

export const deletePbd = ({ id }) => (
  call('pbd.delete', { id })
)

// Messages ----------------------------------------------------------

export const deleteMessage = ({ id }) => (
  call('message.delete', { id })
)

// Tags --------------------------------------------------------------

export const addTag = (id, tag) => (
  call('tag.add', { id, tag })
)

export const removeTag = (id, tag) => (
  call('tag.remove', { id, tag })
)

// Backups -----------------------------------------------------------

export const createSchedule = (jobId, cron, enabled) => (
  call('schedule.create', { jobId, cron, enabled })::tap(
    subscribeSchedules.forceRefresh
  )
)

export const createJob = job => (
  call('job.create', { job })::tap(
    subscribeJobs.forceRefresh
  )
)

export const runJob = id => {
  info(_('runJob'), _('runJobVerbose'))
  return call('job.runSequence', { idSequence: [id] })
}

export const getJob = id => (
  call('job.get', { id })
)

export const setJob = job => (
  call('job.set', { job })::tap(
    subscribeJobs.forceRefresh
  )
)

export const enableSchedule = id => (
  call('scheduler.enable', { id })::tap(
    subscribeScheduleTable.forceRefresh
  )
)

export const disableSchedule = id => (
  call('scheduler.disable', { id })::tap(
    subscribeScheduleTable.forceRefresh
  )
)

export const deleteSchedule = async schedule => {
  await confirm({
    title: _('deleteJob'),
    body: _('deleteJobQuestion')
  })
  await call('schedule.delete', { id: schedule.id })
  await call('job.delete', { id: schedule.job })

  subscribeSchedules.forceRefresh()
}

// Plugins -----------------------------------------------------------

export const loadPlugin = async id => {
  try {
    await call('plugin.load', { id })

    subscribePlugins.forceRefresh()
  } catch (error) {
    info(_('pluginError'), JSON.stringify(error.data) || _('unknownPluginError'))
  }
}

export const unloadPlugin = async id => {
  try {
    await call('plugin.unload', { id })

    subscribePlugins.forceRefresh()
  } catch (error) {
    info(_('pluginError'), JSON.stringify(error.data) || _('unknownPluginError'))
  }
}

export const enablePluginAutoload = id => (
  call('plugin.enableAutoload', { id })::tap(
    subscribePlugins.forceRefresh
  )
)

export const disablePluginAutoload = id => (
  call('plugin.disableAutoload', { id })::tap(
    subscribePlugins.forceRefresh
  )
)

export const configurePlugin = async (id, configuration) => {
  try {
    await call('plugin.configure', { id, configuration })
    info(_('pluginConfigurationSuccess'), _('pluginConfigurationChanges'))

    subscribePlugins.forceRefresh()
  } catch (error) {
    info(_('pluginError'), JSON.stringify(error.data) || _('unknownPluginError'))
    throw error
  }
}

export const purgePluginConfiguration = async id => {
  await confirm({
    title: _('purgePluginConfiguration'),
    body: _('purgePluginConfigurationQuestion')
  })
  await call('plugin.purgeConfiguration', { id })

  subscribePlugins.forceRefresh()
}

// Resource set ------------------------------------------------------

export const createResourceSet = (name, { subjects, objects, limits } = {}) => (
  call('resourceSet.create', { name, subjects, objects, limits })::tap(
    subscribeResourceSets.forceRefresh
  )
)

export const editRessourceSet = (id, { name, subjects, objects, limits } = {}) => (
  call('resourceSet.set', { id, name, subjects, objects, limits })::tap(
    subscribeResourceSets.forceRefresh
  )
)

export const deleteResourceSet = async id => {
  await confirm({
    title: _('deleteResourceSetWarning'),
    body: _('deleteResourceSetQuestion')
  })
  await call('resourceSet.delete', { id })

  subscribeResourceSets.forceRefresh()
}

// Remote ------------------------------------------------------------

export const createRemote = (name, url) => (
  call('remote.create', {name, url})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const deleteRemote = remote => (
  call('remote.delete', {id: resolveId(remote)})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const enableRemote = remote => (
  call('remote.set', {id: resolveId(remote), enabled: true})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const disableRemote = id => (
  call('remote.set', {id, enabled: false})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const editRemote = (remote, {name, url}) => (
  call('remote.set', resolveIds({remote, name, url}))::tap(
    subscribeRemotes.forceRefresh
  )
)

export const listRemote = id => (
  call('remote.list', {id})::tap(
    subscribeRemotes.forceRefresh
  )
)

// -------------------------------------------------------------------

export const probeSrNfs = (host, server) => (
  call('sr.probeNfs', {host, server})
)

export const probeSrNfsExists = (host, server, serverPath) => (
  call('sr.probeNfsExists', {host, server, serverPath})
)

export const probeSrIscsiIqns = (host, target, port = undefined, chapUser = undefined, chapPassword) => {
  const params = {host, target}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return call('sr.probeIscsiIqns', params)
}

export const probeSrIscsiLuns = (host, target, targetIqn, chapUser = undefined, chapPassword) => {
  const params = {host, target, targetIqn}
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return call('sr.probeIscsiLuns', params)
}

export const probeSrIscsiExists = (host, target, targetIqn, scsiId, port = undefined, chapUser = undefined, chapPassword) => {
  const params = {host, target, targetIqn, scsiId}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return call('sr.probeIscsiExists', params)
}

export const reattachSr = (host, uuid, nameLabel, nameDescription, type) => (
  call('sr.reattach', {host, uuid, nameLabel, nameDescription, type})
)

export const reattachSrIso = (host, uuid, nameLabel, nameDescription, type) => (
  call('sr.reattachIso', {host, uuid, nameLabel, nameDescription, type})
)

export const createSrNfs = (host, nameLabel, nameDescription, server, serverPath, nfsVersion = undefined) => {
  const params = {host, nameLabel, nameDescription, server, serverPath}
  nfsVersion && (params.nfsVersion = nfsVersion)
  return call('sr.createNfs', params)
}

export const createSrIscsi = (host, nameLabel, nameDescription, target, targetIqn, scsiId, port = undefined, chapUser = undefined, chapPassword = undefined) => {
  const params = {host, nameLabel, nameDescription, target, targetIqn, scsiId}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return call('sr.createIscsi', params)
}

export const createSrIso = (host, nameLabel, nameDescription, path, type, user = undefined, password = undefined) => {
  const params = {host, nameLabel, nameDescription, path, type}
  user && (params.user = user)
  password && (params.password = password)
  return call('sr.createIso', params)
}

export const createSrLvm = (host, nameLabel, nameDescription, device) => (
  call('sr.createLvm', {host, nameLabel, nameDescription, device})
)

// Job logs ----------------------------------------------------------

export const deleteJobsLog = id => (
  call('log.delete', {namespace: 'jobs', id})::tap(
    subscribeJobsLogs.forceRefresh
  )
)

// Acls, users, groups ----------------------------------------------------------

export const addAcl = ({subject, object, action}) => (
  call('acl.add', resolveIds({subject, object, action}))::tap(
    subscribeAcls.forceRefresh
  )
)

export const removeAcl = ({subject, object, action}) => (
  call('acl.remove', resolveIds({subject, object, action}))::tap(
    subscribeAcls.forceRefresh
  )
)

export const createGroup = name => (
  call('group.create', {name})::tap(
    subscribeGroups.forceRefresh
  )
)

export const setGroupName = (group, name) => (
  call('group.set', resolveIds({group, name}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const deleteGroup = group => (
  call('group.delete', resolveIds({id: group}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const removeUserFromGroup = (user, group) => (
  call('group.removeUser', resolveIds({id: group, userId: user}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const addUserToGroup = (user, group) => (
  call('group.addUser', resolveIds({id: group, userId: user}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const createUser = (email, password, permission) => (
  call('user.create', {email, password, permission})::tap(
    subscribeUsers.forceRefresh
  )
)

export const deleteUser = user => (
  call('user.delete', resolveIds({id: user}))::tap(
    subscribeUsers.forceRefresh
  )
)

export const editUser = (user, { email, password, permission }) => (
  call('user.set', { id: resolveId(user), email, password, permission })::tap(
    subscribeUsers.forceRefresh
  )
)
