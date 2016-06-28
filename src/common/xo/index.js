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

import _ from '../intl'
import invoke from '../invoke'
import logError from '../log-error'
import { confirm } from '../modal'
import { error, info, success } from '../notification'
import { noop, rethrow, tap } from '../utils'
import {
  connected,
  disconnected,
  signedIn,
  signedOut,
  updateObjects,
  updatePermissions
} from '../store/actions'

// ===================================================================

export const isSrWritable = sr => sr.content_type !== 'iso' && sr.size > 0

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

const _signIn = new Promise(resolve => xo.once('authenticated', resolve))

const _call = (method, params) => {
  let promise = _signIn.then(() => xo.call(method, params))

  if (process.env.NODE_ENV !== 'production') {
    promise = promise::rethrow(error => {
      console.error('XO error', {
        method,
        params,
        code: error.code,
        message: error.message,
        data: error.data
      })
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

    _call('xo.getAllObjects').then(objects => store.dispatch(updateObjects(objects)))
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

export const subscribeAcls = createSubscription(() => _call('acl.get'))

export const subscribeJobs = createSubscription(() => _call('job.getAll'))

export const subscribeJobsLogs = createSubscription(() => _call('log.get', {namespace: 'jobs'}))

export const subscribePermissions = createSubscription(() => _call('acl.getCurrentPermissions'))

export const subscribePlugins = createSubscription(() => _call('plugin.get'))

export const subscribeRemotes = createSubscription(() => _call('remote.getAll'))

export const subscribeResourceSets = createSubscription(() => _call('resourceSet.getAll'))

export const subscribeScheduleTable = createSubscription(() => _call('scheduler.getScheduleTable'))

export const subscribeSchedules = createSubscription(() => _call('schedule.getAll'))

export const subscribeServers = createSubscription(invoke(
  fpSortBy('host'),
  sort => () => _call('server.getAll').then(sort)
))

export const subscribeUsers = createSubscription(() => _call('user.getAll').then(users => {
  forEach(users, user => {
    user.type = 'user'
  })

  return sortBy(users, 'email')
}))

export const subscribeGroups = createSubscription(() => _call('group.getAll').then(groups => {
  forEach(groups, group => {
    group.type = 'group'
  })

  return sortBy(groups, 'name')
}))

export const subscribeRoles = createSubscription(invoke(
  sortBy('name'),
  sort => () => _call('role.getAll').then(sort)
))

// System ============================================================

export const apiMethods = _call('system.getMethodsInfo')

export const serverVersion = _call('system.getServerVersion')

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
  _call('server.add', { host, username, password })::tap(
    subscribeServers.forceRefresh
  )
)

export const editServer = ({ id }, { host, username, password, readOnly }) => (
  _call('server.set', { id, host, username, password, readOnly })::tap(
    subscribeServers.forceRefresh
  )
)

export const connectServer = ({ id }) => (
  _call('server.connect', { id })::tap(
    subscribeServers.forceRefresh
  )
)

export const disconnectServer = ({ id }) => (
  _call('server.disconnect', { id })::tap(
    subscribeServers.forceRefresh
  )
)

export const removeServer = ({ id }) => (
  _call('server.remove', { id })::tap(
    subscribeServers.forceRefresh
  )
)

// Host --------------------------------------------------------------

export const editHost = ({ id }, props) => (
  _call('host.set', { ...props, id })
)

export const fetchHostStats = ({ id }, granularity) => (
  _call('host.stats', { host: id, granularity })
)

export const restartHost = ({ id }, force = false) => (
  _call('host.restart', { id, force })
)

export const restartHostAgent = ({ id }) => (
  _call('host.restart_agent', { id })
)

export const startHost = ({ id }) => (
  _call('host.start', { id })
)

export const stopHost = ({ id }) => (
  _call('host.stop', { id })
)

export const enableHost = ({ id }) => (
  _call('host.enable', { id })
)

export const disableHost = ({ id }) => (
  _call('host.disable', { id })
)

export const getHostMissingPatches = ({ id }) => (
  _call('host.listMissingPatches', { host: id })
)

export const emergencyShutdownHost = ({ id }) => (
  _call('host.emergencyShutdownHost', { host: id })
)

export const installHostPatch = ({ id }, { uuid }) => (
  _call('host.installPatch', { host: id, patch: uuid })
)

export const installAllHostPatches = ({ id }) => (
  _call('host.installAllPatches', { host: id })
)

// VM ----------------------------------------------------------------

export const startVm = ({ id }) => (
  _call('vm.start', { id })
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
  _call('vm.stop', { id, force })
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
  _call('vm.suspend', { id })
)

export const resumeVm = ({ id }) => (
  _call('vm.resume', { id })
)

export const recoveryStartVm = ({ id }) => (
  _call('vm.recoveryStart', { id })
)

export const restartVm = ({ id }, force = false) => (
  _call('vm.restart', { id, force })
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
  _call('vm.clone', {
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
    }).then(() => _call('vm.copy', { vm: vm.id, sr: sr.id, name: name || vm.name_label + '_COPY', compress }))
  } else {
    return confirm({
      title: _('copyVm'),
      body: <CopyVmModalBody vm={vm} />
    }).then(
      params => _call('vm.copy', { vm: vm.id, ...params }),
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
    () => _call('vm.convert', { id }),
    noop
  )
)

export const snapshotVm = ({ id }) => (
  _call('vm.snapshot', { id })
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

import MigrateVmModalBody, { MigrateVmsModalBody } from './migrate-vm-modal'
export const migrateVm = (vm, host) => (
  confirm({
    title: _('migrateVmModalTitle'),
    body: <MigrateVmModalBody vm={vm} host={host} />
  }).then(
    params => {
      if (!params) {
        throw new Error('a target host is required to migrate a VM')
      }
      _call('vm.migrate', { vm: vm.id, ...params })
    },
    noop
  )
)
export const migrateVms = vms => (
  confirm({
    title: _('migrateVmModalTitle'),
    body: <MigrateVmsModalBody vms={vms} />
  }).then(
    params => {
      if (!params) {
        throw new Error('a target host is required to migrate a VM')
      }
      Promise.all(map(vms, vm =>
        _call('vm.migrate', { vm: vm.id, ...params })
      ))
    },
    noop
  )
)

export const createVm = args => (
  _call('vm.create', args)
)

export const createVms = (args, nameLabels) => (
  confirm({
    title: _('newVmCreateVms'),
    body: _('newVmCreateVmsConfirm', {nbVms: nameLabels.length})
  }).then(
    () => Promise.all(map(nameLabels, name_label => // eslint-disable-line camelcase
      _call('vm.create', { ...args, name_label })
    )),
    noop
  )
)

export const getCloudInitConfig = template => (
  _call('vm.getCloudInitConfig', { template })
)

export const deleteVm = ({ id }) => (
  confirm({
    title: _('deleteVmModalTitle'),
    body: _('deleteVmModalMessage')
  }).then(
    () => _call('vm.delete', { id, delete_disks: true }),
    noop
  )
)

export const deleteVms = vms => (
  confirm({
    title: _('deleteVmsModalTitle', { vms: vms.length }),
    body: _('deleteVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vmId => _call('vm.delete', { id: vmId })),
    noop
  )
)

export const importBackup = ({remote, file, sr}) => (
  _call('vm.importBackup', resolveIds({remote, file, sr}))
)

export const importDeltaBackup = ({remote, file, sr}) => (
  _call('vm.importDeltaBackup', resolveIds({remote, filePath: file, sr}))
)

export const revertSnapshot = ({ id }) => (
  _call('vm.revert', { id })
)

export const editVm = ({ id }, props) => (
  _call('vm.set', { ...props, id })
)

export const fetchVmStats = ({ id }, granularity) => (
  _call('vm.stats', { id, granularity })
)

export const importVm = (file, sr) => {
  const { name } = file

  info(_('startVmImport'), name)

  return _call('vm.import', { sr }).then(({ $sendTo: url }) => {
    const req = request.post(url)

    req.send(file)
    req.end((err, res) => {
      if (!err && res.status === 200) {
        success(_('vmImportSuccess'), name)
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
  return _call('vm.export', { vm: id })
    .then(({ $getFrom: url }) => window.open(`.${url}`))
}

export const insertCd = (vm, cd, force = false) => (
  _call('vm.insertCd', {
    id: resolveId(vm),
    cd_id: resolveId(cd),
    force
  })
)

export const ejectCd = vm => (
  _call('vm.ejectCd', { id: resolveId(vm) })
)

export const setVmBootOrder = (vm, order) => (
  _call('vm.setBootOrder', {
    vm: resolveId(vm),
    order
  })
)

export const attachDiskToVm = (vdi, vm, {bootable, mode, position}) => (
  _call('vm.attachDisk', {
    bootable,
    mode,
    position: position && String(position) || undefined,
    vdi: resolveId(vdi),
    vm: resolveId(vm)
  })
)

// DISK ---------------------------------------------------------------

export const createDisk = (name, size, sr) => (
  _call('disk.create', {
    name,
    size,
    sr: resolveId(sr)
  })
)

// VDI ---------------------------------------------------------------

export const editVdi = ({ id }, props) => (
  _call('vdi.set', { ...props, id })
)

export const deleteVdi = ({ id }) => (
  _call('vdi.delete', { id })
)

export const migrateVdi = (vdi, sr) => (
  _call('vdi.migrate', { id: vdi.id, sr_id: sr.id })
)

// VDB ---------------------------------------------------------------

export const connectVbd = ({ id }) => (
  _call('vbd.connect', { id })
)

export const disconnectVbd = ({ id }) => (
  _call('vbd.disconnect', { id })
)

export const deleteVbd = ({ id }) => (
  _call('vbd.delete', { id })
)

export const editVbd = ({ id }, props) => (
  _call('vbd.set', { ...props, id })
)

export const setBootableVbd = ({ id }, bootable) => (
  _call('vbd.setBootable', { vbd: id, bootable })
)

// VIF ---------------------------------------------------------------

export const connectVif = vif => (
  _call('vif.connect', { id: resolveId(vif) })
)

export const disconnectVif = vif => (
  _call('vif.disconnect', { id: resolveId(vif) })
)

export const deleteVif = vif => (
  _call('vif.delete', { id: resolveId(vif) })
)

// Network -----------------------------------------------------------

export const editNetwork = ({ id }, props) => (
  _call('network.set', { ...props, id })
)

import CreateNetworkModalBody from './create-network-modal'
export const createNetwork = container => (
  confirm({
    icon: 'network',
    title: _('newNetworkCreate'),
    body: <CreateNetworkModalBody container={container} />
  }).then(
    params => _call('network.create', params),
    noop
  )
)

export const deleteNetwork = network => (
  confirm({
    title: _('deleteNetwork'),
    body: _('deleteNetworkConfirm')
  }).then(
    () => _call('network.delete', { network: resolveId(network) }),
    noop
  )
)

// VIF ---------------------------------------------------------------

export const createVmInterface = (vm, network, mac, mtu) => (
  _call('vm.createInterface', resolveIds({vm, network, mtu, mac}))
)

// PIF ---------------------------------------------------------------

export const connectPif = pif => (
  confirm({
    title: _('connectPif'),
    body: _('connectPifConfirm')
  }).then(
    () => _call('pif.connect', { pif: resolveId(pif) }),
    noop
  )
)

export const disconnectPif = pif => (
  confirm({
    title: _('disconnectPif'),
    body: _('disconnectPifConfirm')
  }).then(
    () => _call('pif.disconnect', { pif: resolveId(pif) }),
    noop
  )
)

export const deletePif = pif => (
  confirm({
    title: _('deletePif'),
    body: _('deletePifConfirm')
  }).then(
    () => _call('pif.delete', { pif: resolveId(pif) }),
    noop
  )
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
    () => _call('sr.destroy', { id }),
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
    () => _call('sr.forget', { id }),
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
    () => _call('sr.connectAllPbds', { id }),
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
    () => _call('sr.disconnectAllPbds', { id }),
    noop
  )
)

export const editSr = (sr, { nameDescription, nameLabel }) => (
  _call('sr.set', {
    id: resolveId(sr),
    name_description: nameDescription,
    name_label: nameLabel
  })
)

export const rescanSr = ({ id }) => (
  _call('sr.scan', { id })
)

// PBDs --------------------------------------------------------------

export const connectPbd = ({ id }) => (
  _call('pbd.connect', { id })
)

export const disconnectPbd = ({ id }) => (
  _call('pbd.disconnect', { id })
)

export const deletePbd = ({ id }) => (
  _call('pbd.delete', { id })
)

// Messages ----------------------------------------------------------

export const deleteMessage = ({ id }) => (
  _call('message.delete', { id })
)

// Tags --------------------------------------------------------------

export const addTag = (id, tag) => (
  _call('tag.add', { id, tag })
)

export const removeTag = (id, tag) => (
  _call('tag.remove', { id, tag })
)

// Tasks --------------------------------------------------------------

export const cancelTask = task => (
  _call('task.cancel', { id: resolveId(task) })
)

export const destroyTask = task => (
  _call('task.destroy', { id: resolveId(task) })
)

// Backups -----------------------------------------------------------

export const createSchedule = (jobId, cron, enabled, name = undefined) => (
  _call('schedule.create', { jobId, cron, enabled, name })::tap(
    subscribeSchedules.forceRefresh
  )
)

export const createJob = job => (
  _call('job.create', { job })::tap(
    subscribeJobs.forceRefresh
  )
)

export const runJob = id => {
  info(_('runJob'), _('runJobVerbose'))
  return _call('job.runSequence', { idSequence: [id] })
}

export const getJob = id => (
  _call('job.get', { id })
)

export const setJob = job => (
  _call('job.set', { job })::tap(
    subscribeJobs.forceRefresh
  )
)

export const getSchedule = id => (
  _call('schedule.get', { id })
)

export const setSchedule = schedule => (
  _call('schedule.set', schedule)::tap(
    subscribeSchedules.forceRefresh
  )
)

export const enableSchedule = id => (
  _call('scheduler.enable', { id })::tap(
    subscribeScheduleTable.forceRefresh
  )
)

export const disableSchedule = id => (
  _call('scheduler.disable', { id })::tap(
    subscribeScheduleTable.forceRefresh
  )
)

export const deleteBackupSchedule = async schedule => {
  await confirm({
    title: _('deleteBackupSchedule'),
    body: _('deleteBackupScheduleQuestion')
  })
  await _call('schedule.delete', { id: schedule.id })
  await _call('job.delete', { id: schedule.job })

  subscribeSchedules.forceRefresh()
  subscribeJobs.forceRefresh()
}

// Plugins -----------------------------------------------------------

export const loadPlugin = async id => (
  _call('plugin.load', { id })::tap(
    subscribePlugins.forceRefresh()
  )::rethrow(
    err => error(_('pluginError'), JSON.stringify(err.data) || _('unknownPluginError'))
  )
)

export const unloadPlugin = id => (
  _call('plugin.unload', { id })::tap(
    subscribePlugins.forceRefresh()
  )::rethrow(
    err => error(_('pluginError'), JSON.stringify(err.data) || _('unknownPluginError'))
  )
)

export const enablePluginAutoload = id => (
  _call('plugin.enableAutoload', { id })::tap(
    subscribePlugins.forceRefresh
  )
)

export const disablePluginAutoload = id => (
  _call('plugin.disableAutoload', { id })::tap(
    subscribePlugins.forceRefresh
  )
)

export const configurePlugin = (id, configuration) => {
  _call('plugin.configure', { id, configuration })::tap(
    () => {
      info(_('pluginConfigurationSuccess'), _('pluginConfigurationChanges'))
      subscribePlugins.forceRefresh()
    }
  )::rethrow(
    err => error(_('pluginError'), JSON.stringify(err.data) || _('unknownPluginError'))
  )
}

export const purgePluginConfiguration = async id => {
  await confirm({
    title: _('purgePluginConfiguration'),
    body: _('purgePluginConfigurationQuestion')
  })
  await _call('plugin.purgeConfiguration', { id })

  subscribePlugins.forceRefresh()
}

// Resource set ------------------------------------------------------

export const createResourceSet = (name, { subjects, objects, limits } = {}) => (
  _call('resourceSet.create', { name, subjects, objects, limits })::tap(
    subscribeResourceSets.forceRefresh
  )
)

export const editRessourceSet = (id, { name, subjects, objects, limits } = {}) => (
  _call('resourceSet.set', { id, name, subjects, objects, limits })::tap(
    subscribeResourceSets.forceRefresh
  )
)

export const deleteResourceSet = async id => {
  await confirm({
    title: _('deleteResourceSetWarning'),
    body: _('deleteResourceSetQuestion')
  })
  await _call('resourceSet.delete', { id })

  subscribeResourceSets.forceRefresh()
}

// Remote ------------------------------------------------------------

export const createRemote = (name, url) => (
  _call('remote.create', {name, url})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const deleteRemote = remote => (
  _call('remote.delete', {id: resolveId(remote)})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const enableRemote = remote => (
  _call('remote.set', {id: resolveId(remote), enabled: true})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const disableRemote = id => (
  _call('remote.set', {id, enabled: false})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const editRemote = (remote, {name, url}) => (
  _call('remote.set', resolveIds({remote, name, url}))::tap(
    subscribeRemotes.forceRefresh
  )
)

export const listRemote = id => (
  _call('remote.list', {id})::tap(
    subscribeRemotes.forceRefresh
  )::rethrow(
    err => error(_('listRemote'), err.message || String(err))
  )
)

// -------------------------------------------------------------------

export const probeSrNfs = (host, server) => (
  _call('sr.probeNfs', {host, server})
)

export const probeSrNfsExists = (host, server, serverPath) => (
  _call('sr.probeNfsExists', {host, server, serverPath})
)

export const probeSrIscsiIqns = (host, target, port = undefined, chapUser = undefined, chapPassword) => {
  const params = {host, target}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.probeIscsiIqns', params)
}

export const probeSrIscsiLuns = (host, target, targetIqn, chapUser = undefined, chapPassword) => {
  const params = {host, target, targetIqn}
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.probeIscsiLuns', params)
}

export const probeSrIscsiExists = (host, target, targetIqn, scsiId, port = undefined, chapUser = undefined, chapPassword) => {
  const params = {host, target, targetIqn, scsiId}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.probeIscsiExists', params)
}

export const reattachSr = (host, uuid, nameLabel, nameDescription, type) => (
  _call('sr.reattach', {host, uuid, nameLabel, nameDescription, type})
)

export const reattachSrIso = (host, uuid, nameLabel, nameDescription, type) => (
  _call('sr.reattachIso', {host, uuid, nameLabel, nameDescription, type})
)

export const createSrNfs = (host, nameLabel, nameDescription, server, serverPath, nfsVersion = undefined) => {
  const params = {host, nameLabel, nameDescription, server, serverPath}
  nfsVersion && (params.nfsVersion = nfsVersion)
  return _call('sr.createNfs', params)
}

export const createSrIscsi = (host, nameLabel, nameDescription, target, targetIqn, scsiId, port = undefined, chapUser = undefined, chapPassword = undefined) => {
  const params = {host, nameLabel, nameDescription, target, targetIqn, scsiId}
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.createIscsi', params)
}

export const createSrIso = (host, nameLabel, nameDescription, path, type, user = undefined, password = undefined) => {
  const params = {host, nameLabel, nameDescription, path, type}
  user && (params.user = user)
  password && (params.password = password)
  return _call('sr.createIso', params)
}

export const createSrLvm = (host, nameLabel, nameDescription, device) => (
  _call('sr.createLvm', {host, nameLabel, nameDescription, device})
)

// Job logs ----------------------------------------------------------

export const deleteJobsLog = id => (
  _call('log.delete', {namespace: 'jobs', id})::tap(
    subscribeJobsLogs.forceRefresh
  )
)

// Acls, users, groups ----------------------------------------------------------

export const addAcl = ({subject, object, action}) => (
  _call('acl.add', resolveIds({subject, object, action}))::tap(
    subscribeAcls.forceRefresh
  )::rethrow(
    err => error('Add ACL', err.message || String(err))
  )
)

export const removeAcl = ({subject, object, action}) => (
  _call('acl.remove', resolveIds({subject, object, action}))::tap(
    subscribeAcls.forceRefresh
  )::rethrow(
    err => error('Remove ACL', err.message || String(err))
  )
)

export const editAcl = (
  {subject, object, action},
  {
    subject: newSubject = subject,
    object: newObject = object,
    action: newAction = action
  }
) => (
  _call('acl.remove', resolveIds({subject, object, action}))
    .then(() => _call('acl.add', resolveIds({subject: newSubject, object: newObject, action: newAction})))
    ::tap(subscribeAcls.forceRefresh)
    ::rethrow(err => error('Edit ACL', err.message || String(err)))
)

export const createGroup = name => (
  _call('group.create', {name})::tap(
    subscribeGroups.forceRefresh
  ):: rethrow(
    err => error(_('createGroup'), err.message || String(err))
  )
)

export const setGroupName = (group, name) => (
  _call('group.set', resolveIds({group, name}))::tap(
    subscribeGroups.forceRefresh
  )
)

export const deleteGroup = group => (
  confirm({
    title: _('deleteGroup'),
    body: <p>{_('deleteGroupConfirm')}</p>
  }).then(() => _call('group.delete', resolveIds({id: group})))
    ::tap(subscribeGroups.forceRefresh)
    ::rethrow(err => error(_('deleteGroup'), err.message || String(err)))
)

export const removeUserFromGroup = (user, group) => (
  _call('group.removeUser', resolveIds({id: group, userId: user}))::tap(
    subscribeGroups.forceRefresh
  )::rethrow(
    err => error(_('removeUserFromGroup'), err.message || String(err))
  )
)

export const addUserToGroup = (user, group) => (
  _call('group.addUser', resolveIds({id: group, userId: user}))::tap(
    subscribeGroups.forceRefresh
  )::rethrow(
    err => error('Add User', err.message || String(err))
  )
)

export const createUser = (email, password, permission) => (
  _call('user.create', {email, password, permission})::tap(
    subscribeUsers.forceRefresh
  )::rethrow(
    err => error('Create user', err.message || String(err))
  )
)

export const deleteUser = user => (
  confirm({
    title: _('deleteUser'),
    body: <p>{_('deleteUserConfirm')}</p>
  }).then(() => _call('user.delete', resolveIds({id: user})))
    ::tap(subscribeUsers.forceRefresh)
    ::rethrow(err => error(_('deleteUser'), err.message || String(err)))
)

export const editUser = (user, { email, password, permission }) => (
  _call('user.set', { id: resolveId(user), email, password, permission })::tap(
    subscribeUsers.forceRefresh
  )
)

export const changePassword = (oldPassword, newPassword) => (
  _call('user.changePassword', {
    oldPassword,
    newPassword
  }).then(
    () => success(_('pwdChangeSuccess'), _('pwdChangeSuccessBody')),
    () => error(_('pwdChangeError'), _('pwdChangeErrorBody'))
  )
)

// Jobs ----------------------------------------------------------

export const deleteJob = job => (
  _call('job.delete', resolveIds({id: job}))::tap(
    subscribeJobs.forceRefresh
  )
)

export const deleteSchedule = schedule => (
  _call('schedule.delete', resolveIds({id: schedule}))::tap(
    subscribeSchedules.forceRefresh
  )
)

export const updateJob = job => (
  _call('job.set', {job})::tap(
    subscribeJobs.forceRefresh
  )
)

export const updateSchedule = ({id, job: jobId, cron, enabled, name}) => (
  _call('schedule.set', {id, jobId, cron, enabled, name})::tap(
    subscribeSchedules.forceRefresh
  )
)
