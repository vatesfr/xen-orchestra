import { createLogger } from '@xen-orchestra/log'
import assert from 'assert'
import { format } from 'json-rpc-peer'

import backupGuard from './_backupGuard.mjs'

const log = createLogger('xo:api:host')

// ===================================================================

export function setMaintenanceMode({ host, maintenance }) {
  const xapi = this.getXapi(host)

  return maintenance ? xapi.clearHost(xapi.getObject(host)) : xapi.enableHost(host._xapiId)
}

setMaintenanceMode.description = 'manage the maintenance mode'

setMaintenanceMode.params = {
  id: { type: 'string' },
  maintenance: { type: 'boolean' },
}

setMaintenanceMode.resolve = {
  host: ['id', 'host', 'administrate'],
}

// ===================================================================

export async function getSchedulerGranularity({ host }) {
  try {
    return await this.getXapi(host).getField('host', host._xapiRef, 'sched_gran')
  } catch (e) {
    // This method is supported on XCP-ng >= 8.2 only.
    if (e.code === 'MESSAGE_METHOD_UNKNOWN') {
      return null
    }
    throw e
  }
}

getSchedulerGranularity.description = 'get the scheduler granularity of a host'

getSchedulerGranularity.params = {
  id: { type: 'string' },
}

getSchedulerGranularity.resolve = {
  host: ['id', 'host', 'view'],
}

// ===================================================================

export async function setSchedulerGranularity({ host, schedulerGranularity }) {
  await this.getXapi(host).setField('host', host._xapiRef, 'sched_gran', schedulerGranularity)
}

setSchedulerGranularity.description = 'set scheduler granularity of a host'

setSchedulerGranularity.params = {
  id: { type: 'string' },
  schedulerGranularity: {
    enum: ['cpu', 'core', 'socket'],
  },
}

setSchedulerGranularity.resolve = {
  host: ['id', 'host', 'operate'],
}

// ===================================================================

export async function set({
  host,

  iscsiIqn,
  multipathing,
  name_label: nameLabel,
  name_description: nameDescription,
}) {
  host = this.getXapiObject(host)

  await Promise.all([
    iscsiIqn !== undefined &&
      (host.iscsi_iqn !== undefined
        ? host.set_iscsi_iqn(iscsiIqn)
        : host.update_other_config('iscsi_iqn', iscsiIqn === '' ? null : iscsiIqn)),
    nameDescription !== undefined && host.set_name_description(nameDescription),
    nameLabel !== undefined && host.set_name_label(nameLabel),
    multipathing !== undefined && host.$xapi.setHostMultipathing(host.$id, multipathing),
  ])
}

set.description = 'changes the properties of an host'

set.params = {
  id: { type: 'string' },
  iscsiIqn: { type: 'string', optional: true },
  name_label: {
    type: 'string',
    optional: true,
  },
  name_description: {
    type: 'string',
    minLength: 0,
    optional: true,
  },
  multipathing: {
    type: 'boolean',
    optional: true,
  },
}

set.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

// FIXME: set force to false per default when correctly implemented in
// UI.
export async function restart({ bypassBackupCheck = false, host, force = true, suspendResidentVms }) {
  if (bypassBackupCheck) {
    log.warn('host.restart with argument "bypassBackupCheck" set to true', { hostId: host.id })
  } else {
    await backupGuard.call(this, host.$poolId)
  }

  const xapi = this.getXapi(host)
  return suspendResidentVms ? xapi.host_smartReboot(host._xapiRef) : xapi.rebootHost(host._xapiId, force)
}

restart.description = 'restart the host'

restart.params = {
  bypassBackupCheck: {
    type: 'boolean',
    optional: true,
  },
  id: { type: 'string' },
  force: {
    type: 'boolean',
    optional: true,
  },
  suspendResidentVms: {
    type: 'boolean',
    default: false,
  },
}

restart.resolve = {
  host: ['id', 'host', 'operate'],
}

// -------------------------------------------------------------------

export async function restartAgent({ bypassBackupCheck = false, host }) {
  if (bypassBackupCheck) {
    log.warn('host.restartAgent with argument "bypassBackupCheck" set to true', { hostId: host.id })
  } else {
    await backupGuard.call(this, host.$poolId)
  }
  return this.getXapiObject(host).$restartAgent()
}

restartAgent.description = 'restart the Xen agent on the host'

restartAgent.params = {
  bypassBackupCheck: {
    type: 'boolean',
    optional: true,
  },
  id: { type: 'string' },
}

restartAgent.resolve = {
  host: ['id', 'host', 'administrate'],
}

// TODO: remove deprecated alias
export const restart_agent = 'restartAgent' // eslint-disable-line camelcase

// -------------------------------------------------------------------

export function setRemoteSyslogHost({ host, syslogDestination }) {
  return this.getXapi(host).setRemoteSyslogHost(host._xapiId, syslogDestination)
}

setRemoteSyslogHost.params = {
  id: { type: 'string' },
  syslogDestination: { type: 'string' },
}

setRemoteSyslogHost.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export function start({ host }) {
  return this.getXapi(host).powerOnHost(host._xapiId)
}

start.description = 'start the host'

start.params = {
  id: { type: 'string' },
}

start.resolve = {
  host: ['id', 'host', 'operate'],
}

// -------------------------------------------------------------------

export async function stop({ bypassBackupCheck = false, host, bypassEvacuate }) {
  if (bypassBackupCheck) {
    log.warn('host.stop with argument "bypassBackupCheck" set to true', { hostId: host.id })
  } else {
    await backupGuard.call(this, host.$poolId)
  }
  return this.getXapi(host).shutdownHost(host._xapiId, { bypassEvacuate })
}

stop.description = 'stop the host'

stop.params = {
  bypassBackupCheck: {
    type: 'boolean',
    optional: true,
  },
  id: { type: 'string' },
  bypassEvacuate: { type: 'boolean', optional: true },
}

stop.resolve = {
  host: ['id', 'host', 'operate'],
}

// -------------------------------------------------------------------

export function detach({ host }) {
  return this.detachHostFromPool(host._xapiId)
}

detach.description = 'eject the host of a pool'

detach.params = {
  id: { type: 'string' },
}

detach.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export function enable({ host }) {
  return this.getXapi(host).enableHost(host._xapiId)
}

enable.description = 'enable to create VM on the host'

enable.params = {
  id: { type: 'string' },
}

enable.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export function disable({ host }) {
  return this.getXapi(host).disableHost(host._xapiId)
}

disable.description = 'disable to create VM on the hsot'

disable.params = {
  id: { type: 'string' },
}

disable.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export function forget({ host }) {
  return this.getXapi(host).forgetHost(host._xapiId)
}

forget.description = 'remove the host record from XAPI database'

forget.params = {
  id: { type: 'string' },
}

forget.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export function emergencyShutdownHost({ host }) {
  return this.getXapi(host).emergencyShutdownHost(host._xapiId)
}

emergencyShutdownHost.description = 'suspend all VMs and shutdown host'

emergencyShutdownHost.params = {
  host: { type: 'string' },
}

emergencyShutdownHost.resolve = {
  host: ['host', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export async function isHostServerTimeConsistent({ host }) {
  return this.getXapi(host).isHostServerTimeConsistent(host._xapiRef)
}

isHostServerTimeConsistent.params = {
  host: { type: 'string' },
}

isHostServerTimeConsistent.resolve = {
  host: ['host', 'host', 'view'],
}

// -------------------------------------------------------------------

export function stats({ host, granularity }) {
  return this.getXapiHostStats(host._xapiId, granularity)
}

stats.description = 'returns statistic of the host'

stats.params = {
  host: { type: 'string' },
  granularity: {
    type: 'string',
    optional: true,
  },
}

stats.resolve = {
  host: ['host', 'host', 'view'],
}

// -------------------------------------------------------------------

async function handleInstallSupplementalPack(req, res, { hostId }) {
  const xapi = this.getXapi(hostId)

  // Timeout seems to be broken in Node 4.
  // See https://github.com/nodejs/node/issues/3319
  req.setTimeout(43200000) // 12 hours
  req.length = req.headers['content-length']
  await xapi.installSupplementalPack(req, { hostId })
  res.end(format.response(0))
}

export async function installSupplementalPack({ host }) {
  return {
    $sendTo: await this.registerHttpRequest(handleInstallSupplementalPack, {
      hostId: host.id,
    }),
  }
}

installSupplementalPack.description = 'installs supplemental pack from ISO file'

installSupplementalPack.params = {
  host: { type: 'string' },
}

installSupplementalPack.resolve = {
  host: ['host', 'host', 'admin'],
}

// -------------------------------------------------------------------

export function isHyperThreadingEnabled({ host }) {
  return this.getXapi(host).isHyperThreadingEnabled(host._xapiId)
}

isHyperThreadingEnabled.description = 'get hyper-threading information'

isHyperThreadingEnabled.params = {
  id: { type: 'string' },
}

isHyperThreadingEnabled.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export async function scanPifs({ host }) {
  await this.getXapi(host).callAsync('PIF.scan', host._xapiRef)
}

scanPifs.description = 'Refresh the list of physical interfaces for this host'

scanPifs.params = {
  id: { type: 'string' },
}

scanPifs.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export async function installCertificate({ host, ...props }) {
  host = this.getXapiObject(host)
  await host.$xapi.installCertificateOnHost(host.$id, props)
}

installCertificate.description = 'Install a certificate on a host'

installCertificate.params = {
  id: { type: 'string' },
  certificate: { type: 'string' },
  chain: { type: 'string', optional: true },
  privateKey: { type: 'string' },
}

installCertificate.resolve = {
  host: ['id', 'host', 'administrate'],
}

// -------------------------------------------------------------------

export async function setControlDomainMemory({ host, memory }) {
  assert(!host.enabled)

  const controlDomain = this.getXapiObject(host.controlDomain, 'VM-controller')

  const xapi = controlDomain.$xapi
  await xapi.call('VM.set_memory_limits', controlDomain.$ref, controlDomain.memory_static_min, memory, memory, memory)
  await xapi.rebootHost(host._xapiId)
}

setControlDomainMemory.description = "Set host's control domain memory and restart the host"

setControlDomainMemory.params = {
  id: { type: 'string' },
  memory: { type: 'number' },
}

setControlDomainMemory.resolve = {
  host: ['id', 'host', 'administrate'],
}
