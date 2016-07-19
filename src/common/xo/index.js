import asap from 'asap'
import assign from 'lodash/assign'
import cookies from 'cookies-js'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import once from 'lodash/once'
import React from 'react'
import fpSortBy from 'lodash/fp/sortBy'
import request from 'superagent'
import size from 'lodash/size'
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
export const isSrShared = sr => sr.$PBDs.length > 1

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

export const getXoServerTimezone = _call('system.getServerTimezone')

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

// Pool --------------------------------------------------------------

export const editPool = (pool, props) => (
  _call('pool.set', { id: resolveId(pool), ...props })
)

// Host --------------------------------------------------------------

export const editHost = (host, props) => (
  _call('host.set', { ...props, id: resolveId(host) })
)

export const fetchHostStats = (host, granularity) => (
  _call('host.stats', { host: resolveId(host), granularity })
)

export const restartHost = (host, force = false) => (
  confirm({
    title: _('restartHostModalTitle'),
    body: _('restartHostModalMessage')
  }).then(
    () => _call('host.restart', { id: resolveId(host), force }),
    noop
  )
)

export const restartHosts = (hosts, force) => {
  const nHosts = size(hosts)
  return confirm({
    title: _('restartHostsModalTitle', { nHosts }),
    body: _('restartHostsModalMessage', { nHosts })
  }).then(
    () => map(hosts, host => _call('host.restart', { id: resolveId(host), force })),
    noop
  )
}

export const restartHostAgent = host => (
  _call('host.restart_agent', { id: resolveId(host) })
)

export const restartHostsAgents = hosts => {
  const nHosts = size(hosts)
  return confirm({
    title: _('restartHostsAgentsModalTitle', { nHosts }),
    body: _('restartHostsAgentsModalMessage', { nHosts })
  }).then(
    () => map(hosts, host => restartHostAgent(host)),
    noop
  )
}

export const startHost = host => (
  _call('host.start', { id: resolveId(host) })
)

export const stopHost = host => (
  confirm({
    title: _('stopHostModalTitle'),
    body: _('stopHostModalMessage')
  }).then(
    () => _call('host.stop', { id: resolveId(host) }),
    noop
  )
)

export const stopHosts = hosts => {
  const nHosts = size(hosts)
  return confirm({
    title: _('stopHostsModalTitle', { nHosts }),
    body: _('stopHostsModalMessage', { nHosts })
  }).then(
    () => map(hosts, host => _call('host.stop', { id: resolveId(host) })),
    noop
  )
}

export const enableHost = host => (
  _call('host.enable', { id: resolveId(host) })
)

export const disableHost = host => (
  _call('host.disable', { id: resolveId(host) })
)

export const getHostMissingPatches = host => (
  _call('host.listMissingPatches', { host: resolveId(host) })
)

export const emergencyShutdownHost = host => (
  _call('host.emergencyShutdownHost', { host: resolveId(host) })
)

export const emergencyShutdownHosts = hosts => {
  const nHosts = size(hosts)
  return confirm({
    title: _('emergencyShutdownHostsModalTitle', { nHosts }),
    body: _('emergencyShutdownHostsModalMessage', { nHosts })
  }).then(
    () => map(hosts, host => emergencyShutdownHost(host)),
    noop
  )
}

export const installHostPatch = (host, { uuid }) => (
  _call('host.installPatch', { host: resolveId(host), patch: uuid })
)

export const installAllHostPatches = host => (
  _call('host.installAllPatches', { host: resolveId(host) })
)

// VM ----------------------------------------------------------------

export const startVm = vm => (
  _call('vm.start', { id: resolveId(vm) })
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

export const stopVm = (vm, force = false) => (
  confirm({
    title: _('stopVmModalTitle'),
    body: _('stopVmModalMessage', { name: vm.name_label })
  }).then(
    () => _call('vm.stop', { id: resolveId(vm), force }),
    noop
  )
)

export const stopVms = (vms, force = false) => (
  confirm({
    title: _('stopVmsModalTitle', { vms: vms.length }),
    body: _('stopVmsModalMessage', { vms: vms.length })
  }).then(
    () => map(vms, vm => _call('vm.stop', { id: resolveId(vm), force })),
    noop
  )
)

export const suspendVm = vm => (
  _call('vm.suspend', { id: resolveId(vm) })
)

export const resumeVm = vm => (
  _call('vm.resume', { id: resolveId(vm) })
)

export const recoveryStartVm = vm => (
  _call('vm.recoveryStart', { id: resolveId(vm) })
)

export const restartVm = (vm, force = false) => (
  confirm({
    title: _('restartVmModalTitle'),
    body: _('restartVmModalMessage', { name: vm.name_label })
  }).then(
    () => _call('vm.restart', { id: resolveId(vm), force }),
    noop
  )
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
      params => {
        if (!params.sr) {
          error('copyVmsNoTargetSr', 'copyVmsNoTargetSrMessage')
          return
        }
        _call('vm.copy', { vm: vm.id, ...params })
      },
      noop
    )
  }
}

import CopyVmsModalBody from './copy-vms-modal'
export const copyVms = vms => {
  const _vms = resolveIds(vms)
  return confirm({
    title: _('copyVm'),
    body: <CopyVmsModalBody vms={_vms} />
  }).then(
    params => {
      if (!params.sr) {
        error(_('copyVmsNoTargetSr'), _('copyVmsNoTargetSrMessage'))
        return
      }
      const {
        compress,
        names,
        sr
      } = params
      Promise.all(map(_vms, (vm, index) =>
        _call('vm.copy', { vm, sr, compress, name: names[index] }),
      ))
    },
    noop
  )
}

export const convertVmToTemplate = vm => (
  confirm({
    title: 'Convert to template',
    body: <div>
      <p>Are you sure you want to convert this VM into a template?</p>
      <p>This operation is definitive.</p>
    </div>
  }).then(
    () => _call('vm.convert', { id: resolveId(vm) }),
    noop
  )
)

export const snapshotVm = vm => (
  _call('vm.snapshot', { id: resolveId(vm) })
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
export const migrateVm = (vm, host) => (
  confirm({
    title: _('migrateVmModalTitle'),
    body: <MigrateVmModalBody vm={vm} host={host} />
  }).then(
    params => {
      if (!params.targetHost) {
        return error(_('migrateVmNoTargetHost'), _('migrateVmNoTargetHostMessage'))
      }
      _call('vm.migrate', { vm: vm.id, ...params })
    },
    noop
  )
)

import MigrateVmsModalBody from './migrate-vms-modal'
export const migrateVms = vms => (
  confirm({
    title: _('migrateVmModalTitle'),
    body: <MigrateVmsModalBody vms={resolveIds(vms)} />
  }).then(
    params => {
      if (isEmpty(params.vms)) {
        return
      }
      if (!params.targetHost) {
        return error(_('migrateVmNoTargetHost'), _('migrateVmNoTargetHostMessage'))
      }

      const {
        mapVmsMapVdisSrs,
        mapVmsMapVifsNetworks,
        mapVmsMigrationNetwork,
        targetHost,
        vms
      } = params
      Promise.all(map(vms, ({ id }) =>
        _call('vm.migrate', {
          mapVdisSrs: mapVmsMapVdisSrs[id],
          mapVifsNetworks: mapVmsMapVifsNetworks[id],
          migrationNetwork: mapVmsMigrationNetwork[id],
          targetHost,
          vm: id
        })
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

export const deleteVm = vm => (
  confirm({
    title: _('deleteVmModalTitle'),
    body: _('deleteVmModalMessage')
  }).then(
    () => _call('vm.delete', { id: resolveId(vm), delete_disks: true }),
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

export const revertSnapshot = vm => (
  _call('vm.revert', { id: resolveId(vm) })
)

export const editVm = (vm, props) => (
  _call('vm.set', { ...props, id: resolveId(vm) })
)

export const fetchVmStats = (vm, granularity) => (
  _call('vm.stats', { id: resolveId(vm), granularity })
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

export const exportVm = vm => {
  info(_('startVmExport'), vm.id)
  return _call('vm.export', { vm: resolveId(vm) })
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

export const editVdi = (vdi, props) => (
  _call('vdi.set', { ...props, id: resolveId(vdi) })
)

export const deleteVdi = vdi => (
  _call('vdi.delete', { id: resolveId(vdi) })
)

export const migrateVdi = (vdi, sr) => (
  _call('vdi.migrate', { id: resolveId(vdi), sr_id: resolveId(sr) })
)

// VDB ---------------------------------------------------------------

export const connectVbd = vbd => (
  _call('vbd.connect', { id: resolveId(vbd) })
)

export const disconnectVbd = vbd => (
  _call('vbd.disconnect', { id: resolveId(vbd) })
)

export const deleteVbd = vbd => (
  _call('vbd.delete', { id: resolveId(vbd) })
)

export const editVbd = (vbd, props) => (
  _call('vbd.set', { ...props, id: resolveId(vbd) })
)

export const setBootableVbd = (vbd, bootable) => (
  _call('vbd.setBootable', { vbd: resolveId(vbd), bootable })
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

export const editNetwork = (network, props) => (
  _call('network.set', { ...props, id: resolveId(network) })
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

export const deleteSr = sr => (
  confirm({
    title: 'Delete SR',
    body: <div>
      <p>Are you sure you want to remove this SR?</p>
      <p>This operation is definitive, and ALL DISKS WILL BE LOST FOREVER.</p>
    </div>
  }).then(
    () => _call('sr.destroy', { id: resolveId(sr) }),
    noop
  )
)

export const forgetSr = sr => (
  confirm({
    title: 'Forget SR',
    body: <div>
      <p>Are you sure you want to forget this SR?</p>
      <p>VDIs on this storage wont be removed.</p>
    </div>
  }).then(
    () => _call('sr.forget', { id: resolveId(sr) }),
    noop
  )
)

export const reconnectAllHostsSr = sr => (
  confirm({
    title: 'Reconnect all hosts',
    body: <div>
      <p>This will reconnect this SR to all its hosts</p>
    </div>
  }).then(
    () => _call('sr.connectAllPbds', { id: resolveId(sr) }),
    noop
  )
)

export const disconnectAllHostsSr = sr => (
  confirm({
    title: 'Disconnect all hosts',
    body: <div>
      <p>This will disconnect this SR to all its hosts</p>
    </div>
  }).then(
    () => _call('sr.disconnectAllPbds', { id: resolveId(sr) }),
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

export const rescanSr = sr => (
  _call('sr.scan', { id: resolveId(sr) })
)

// PBDs --------------------------------------------------------------

export const connectPbd = pbd => (
  _call('pbd.connect', { id: resolveId(pbd) })
)

export const disconnectPbd = pbd => (
  _call('pbd.disconnect', { id: resolveId(pbd) })
)

export const deletePbd = pbd => (
  _call('pbd.delete', { id: resolveId(pbd) })
)

// Messages ----------------------------------------------------------

export const deleteMessage = pbd => (
  _call('message.delete', { id: resolveId(pbd) })
)

// Tags --------------------------------------------------------------

export const addTag = (object, tag) => (
  _call('tag.add', { id: resolveId(object), tag })
)

export const removeTag = (object, tag) => (
  _call('tag.remove', { id: resolveId(object), tag })
)

// Tasks --------------------------------------------------------------

export const cancelTask = task => (
  _call('task.cancel', { id: resolveId(task) })
)

export const destroyTask = task => (
  _call('task.destroy', { id: resolveId(task) })
)

// Backups -----------------------------------------------------------

export const createSchedule = (jobId, {
  cron,
  enabled,
  name = undefined,
  timezone = undefined
}) => (
  _call('schedule.create', { jobId, cron, enabled, name, timezone })::tap(
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

export const disableRemote = remote => (
  _call('remote.set', {id: resolveId(remote), enabled: false})::tap(
    subscribeRemotes.forceRefresh
  )
)

export const editRemote = (remote, {name, url}) => (
  _call('remote.set', resolveIds({remote, name, url}))::tap(
    subscribeRemotes.forceRefresh
  )
)

export const listRemote = remote => (
  _call('remote.list', resolveIds({id: remote}))::tap(
    subscribeRemotes.forceRefresh
  )::rethrow(
    err => error(_('listRemote'), err.message || String(err))
  )
)

export const testRemote = remote => (
  _call('remote.test', resolveIds({id: remote}))::rethrow(
    err => error(_('testRemote'), err.message || String(err))
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

export const updateSchedule = ({ id, job: jobId, cron, enabled, name, timezone }) => (
  _call('schedule.set', { id, jobId, cron, enabled, name, timezone })::tap(
    subscribeSchedules.forceRefresh
  )
)
