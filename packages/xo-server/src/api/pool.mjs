import TTLCache from '@isaacs/ttlcache'
import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { format } from 'json-rpc-peer'
import { Ref } from 'xen-api'
import { incorrectState } from 'xo-common/api-errors.js'

import backupGuard from './_backupGuard.mjs'

import { moveFirst } from '../_moveFirst.mjs'

const log = createLogger('xo:api:pool')

const TTL_CACHE = 3e4
const CACHE = new TTLCache({
  ttl: TTL_CACHE,
})

// ===================================================================

export async function set({
  pool,

  auto_poweron,
  name_description: nameDescription,
  name_label: nameLabel,
  backupNetwork,
  migrationCompression,
  migrationNetwork,
  suspendSr,
  crashDumpSr,
}) {
  pool = this.getXapiObject(pool)

  await Promise.all([
    auto_poweron !== undefined && pool.update_other_config('auto_poweron', String(auto_poweron)),
    nameDescription !== undefined && pool.set_name_description(nameDescription),
    nameLabel !== undefined && pool.set_name_label(nameLabel),
    migrationCompression !== undefined && pool.set_migration_compression(migrationCompression),
    migrationNetwork !== undefined && pool.update_other_config('xo:migrationNetwork', migrationNetwork),
    backupNetwork !== undefined && pool.update_other_config('xo:backupNetwork', backupNetwork),
    suspendSr !== undefined && pool.$call('set_suspend_image_SR', suspendSr === null ? Ref.EMPTY : suspendSr._xapiRef),
    crashDumpSr !== undefined &&
      pool.$call('set_crash_dump_SR', crashDumpSr === null ? Ref.EMPTY : crashDumpSr._xapiRef),
  ])
}

set.params = {
  id: {
    type: 'string',
  },
  auto_poweron: {
    type: 'boolean',
    optional: true,
  },
  name_label: {
    type: 'string',
    optional: true,
  },
  name_description: {
    type: 'string',
    minLength: 0,
    optional: true,
  },
  backupNetwork: {
    type: ['string', 'null'],
    optional: true,
  },
  migrationCompression: {
    type: 'boolean',
    optional: true,
  },
  migrationNetwork: {
    type: ['string', 'null'],
    optional: true,
  },
  suspendSr: {
    type: ['string', 'null'],
    optional: true,
  },
  crashDumpSr: {
    type: ['string', 'null'],
    optional: true,
  },
}

set.resolve = {
  pool: ['id', 'pool', 'administrate'],
  suspendSr: ['suspendSr', 'SR', 'administrate'],
  crashDumpSr: ['crashDumpSr', 'SR', 'administrate'],
}

// -------------------------------------------------------------------

export async function setDefaultSr({ sr }) {
  await this.hasPermissions(this.apiContext.user.id, [[sr.$pool, 'administrate']])

  await this.getXapi(sr).setDefaultSr(sr._xapiId)
}

setDefaultSr.params = {
  sr: {
    type: 'string',
  },
}

setDefaultSr.resolve = {
  sr: ['sr', 'SR'],
}

// -------------------------------------------------------------------

export async function setPoolMaster({ host }) {
  await this.hasPermissions(this.apiContext.user.id, [[host.$pool, 'administrate']])

  await this.getXapi(host).setPoolMaster(host._xapiId)
}

setPoolMaster.params = {
  host: {
    type: 'string',
  },
}

setPoolMaster.resolve = {
  host: ['host', 'host'],
}

// -------------------------------------------------------------------

export async function disableHa({ pool }) {
  await this.getXapi(pool).disableHa()
}

disableHa.params = {
  pool: {
    type: 'string',
  },
}

disableHa.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

export async function enableHa({ pool, heartbeatSrs, configuration }) {
  await this.getXapi(pool).enableHa(heartbeatSrs, configuration)
}

enableHa.params = {
  pool: {
    type: 'string',
  },
  heartbeatSrs: {
    type: 'array',
    items: { type: 'string' },
  },
  configuration: {
    type: 'object',
  },
}

enableHa.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

// Returns an array of missing new patches in the host
// Returns an empty array if up-to-date
export function listMissingPatches({ host }) {
  return this.getXapi(host).listMissingPatches(host._xapiId)
}

listMissingPatches.description = 'return an array of missing new patches in the host'

listMissingPatches.params = {
  host: { type: 'string' },
}

listMissingPatches.resolve = {
  host: ['host', 'host', 'view'],
}

// -------------------------------------------------------------------

export async function installPatches({ pool, patches, hosts }) {
  const opts = { patches, xsCredentials: this.apiContext.user.preferences.xsCredentials }
  let xapi
  if (pool !== undefined) {
    pool = this.getXapiObject(pool, 'pool')
    xapi = pool.$xapi
    hosts = Object.values(xapi.objects.indexes.type.host)
  } else {
    hosts = await asyncMap(hosts, async hostId => {
      await this.checkPermissions([[hostId, 'administrate']])
      return this.getXapiObject(hostId)
    })
    opts.hosts = hosts
    xapi = hosts[0].$xapi
    pool = xapi.pool
  }

  if (pool.ha_enabled) {
    throw incorrectState({
      actual: pool.ha_enabled,
      expected: false,
      object: pool.$id,
      property: 'ha_enabled',
    })
  }

  await xapi.installPatches(opts)

  const masterRef = pool.master
  if (moveFirst(hosts, _ => _.$ref === masterRef)) {
    await hosts.shift().$restartAgent()
  }

  await asyncMap(hosts, host => host.$restartAgent())
}

installPatches.params = {
  pool: { type: 'string', optional: true },
  patches: { type: 'array', optional: true },
  hosts: { type: 'array', optional: true },
}

installPatches.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

installPatches.description = 'Install patches on hosts'

// -------------------------------------------------------------------

export const rollingUpdate = async function ({ bypassBackupCheck = false, pool }) {
  const poolId = pool.id
  if (bypassBackupCheck) {
    log.warn('pool.rollingUpdate update with argument "bypassBackupCheck" set to true', { poolId })
  } else {
    await backupGuard.call(this, poolId)
  }

  await this.rollingPoolUpdate(pool)
}

rollingUpdate.params = {
  bypassBackupCheck: {
    optional: true,
    type: 'boolean',
  },
  pool: { type: 'string' },
}

rollingUpdate.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

export async function rollingReboot({ bypassBackupCheck, pool }) {
  const poolId = pool.id
  if (bypassBackupCheck) {
    log.warn('pool.rollingReboot update with argument "bypassBackupCheck" set to true', { poolId })
  } else {
    await backupGuard.call(this, poolId)
  }

  await this.rollingPoolReboot(pool)
}

rollingReboot.params = {
  bypassBackupCheck: {
    default: false,
    type: 'boolean',
  },
  pool: { type: 'string' },
}

rollingReboot.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

export async function getPatchesDifference({ source, target }) {
  return this.getPatchesDifference(target.id, source.id)
}

getPatchesDifference.params = {
  source: { type: 'string' },
  target: { type: 'string' },
}

getPatchesDifference.resolve = {
  source: ['source', 'host', 'view'],
  target: ['target', 'host', 'view'],
}

// -------------------------------------------------------------------

export async function mergeInto({ source, sources = [source], target, force }) {
  await this.checkPermissions(sources.map(source => [source, 'administrate']))
  return this.mergeInto({
    force,
    sources,
    target,
  })
}

mergeInto.params = {
  force: { type: 'boolean', optional: true },
  source: { type: 'string', optional: true },
  sources: {
    type: 'array',
    items: { type: 'string' },
    optional: true,
  },
  target: { type: 'string' },
}

mergeInto.resolve = {
  target: ['target', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

export async function getLicenseState({ pool }) {
  return this.getXapi(pool).call('pool.get_license_state', pool._xapiId.$ref)
}

getLicenseState.params = {
  pool: {
    type: 'string',
  },
}

getLicenseState.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

export async function getGuestSecureBootReadiness({ pool, forceRefresh }) {
  const xapi = this.getXapi(pool)
  const poolRef = pool._xapiRef
  const xapiMethodName = 'pool.get_guest_secureboot_readiness'

  if (forceRefresh) {
    CACHE.delete(xapi.computeCacheKey(xapiMethodName, poolRef))
  }

  return xapi.call(CACHE, xapiMethodName, poolRef)
}

getGuestSecureBootReadiness.params = {
  id: { type: 'string' },
  forceRefresh: { type: 'boolean', default: false },
}

getGuestSecureBootReadiness.resolve = {
  pool: ['id', 'pool', null],
}

// -------------------------------------------------------------------

async function handleInstallSupplementalPack(req, res, { poolId }) {
  const xapi = this.getXapi(poolId)

  // Timeout seems to be broken in Node 4.
  // See https://github.com/nodejs/node/issues/3319
  req.setTimeout(43200000) // 12 hours
  req.length = req.headers['content-length']
  await xapi.installSupplementalPackOnAllHosts(req)
  res.end(format.response(0))
}

export async function installSupplementalPack({ pool }) {
  return {
    $sendTo: await this.registerHttpRequest(handleInstallSupplementalPack, {
      poolId: pool.id,
    }),
  }
}

installSupplementalPack.description = 'installs supplemental pack from ISO file on all hosts'

installSupplementalPack.params = {
  pool: { type: 'string' },
}

installSupplementalPack.resolve = {
  pool: ['pool', 'pool', 'admin'],
}

// -------------------------------------------------------------------

export async function listPoolsMatchingCriteria(params) {
  return this.listPoolsMatchingCriteria(params)
}

listPoolsMatchingCriteria.params = {
  minAvailableHostMemory: { type: 'number', optional: true },
  minAvailableSrSize: { type: 'number', optional: true },
  minHostCpus: { type: 'number', optional: true },
  minHostVersion: { type: 'string', optional: true },
  poolNameRegExp: { type: 'string', optional: true },
  srNameRegExp: { type: 'string', optional: true },
}
