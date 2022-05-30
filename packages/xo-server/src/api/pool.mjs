import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { defer as deferrable } from 'golike-defer'
import { format } from 'json-rpc-peer'
import { Ref } from 'xen-api'
import { incorrectState } from 'xo-common/api-errors.js'

import backupGuard from './_backupGuard.mjs'

import { moveFirst } from '../_moveFirst.mjs'

const log = createLogger('xo:api:pool')

// ===================================================================

export async function set({
  pool,

  name_description: nameDescription,
  name_label: nameLabel,
  backupNetwork,
  migrationNetwork,
  suspendSr,
}) {
  pool = this.getXapiObject(pool)

  await Promise.all([
    nameDescription !== undefined && pool.set_name_description(nameDescription),
    nameLabel !== undefined && pool.set_name_label(nameLabel),
    migrationNetwork !== undefined && pool.update_other_config('xo:migrationNetwork', migrationNetwork),
    backupNetwork !== undefined && pool.update_other_config('xo:backupNetwork', backupNetwork),
    suspendSr !== undefined && pool.$call('set_suspend_image_SR', suspendSr === null ? Ref.EMPTY : suspendSr._xapiRef),
  ])
}

set.params = {
  id: {
    type: 'string',
  },
  name_label: {
    type: 'string',
    optional: true,
  },
  name_description: {
    type: 'string',
    optional: true,
  },
  backupNetwork: {
    type: ['string', 'null'],
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
}

set.resolve = {
  pool: ['id', 'pool', 'administrate'],
  suspendSr: ['suspendSr', 'SR', 'administrate'],
}

// -------------------------------------------------------------------

export async function setDefaultSr({ sr }) {
  await this.hasPermissions(this.user.id, [[sr.$pool, 'administrate']])

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
  await this.hasPermissions(this.user.id, [[host.$pool, 'administrate']])

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
  const opts = { patches }
  let xapi
  if (pool !== undefined) {
    pool = this.getXapiObject(pool, 'pool')
    xapi = pool.$xapi
    hosts = Object.values(xapi.objects.indexes.type.host)
  } else {
    hosts = hosts.map(_ => this.getXapiObject(_))
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

export const rollingUpdate = deferrable(async function ($defer, { bypassBackupCheck = false, pool }) {
  const poolId = pool.id
  if (bypassBackupCheck) {
    log.warn('pool.rollingUpdate update with argument "bypassBackupCheck" set to true', { poolId })
  } else {
    await backupGuard.call(this, poolId)
  }

  if ((await this.getOptionalPlugin('load-balancer'))?.loaded) {
    await this.unloadPlugin('load-balancer')
    $defer(() => this.loadPlugin('load-balancer'))
  }

  await this.getXapi(pool).rollingPoolUpdate()
})

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

async function handlePatchUpload(req, res, { pool }) {
  const contentLength = req.headers['content-length']
  if (!contentLength) {
    res.writeHead(411)
    res.end('Content length is mandatory')
    return
  }

  await this.getXapi(pool).uploadPoolPatch(req, contentLength)
}

export async function uploadPatch({ pool }) {
  return {
    $sendTo: await this.registerHttpRequest(handlePatchUpload, { pool }),
  }
}

uploadPatch.params = {
  pool: { type: 'string' },
}

uploadPatch.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// Compatibility
//
// TODO: remove when no longer used in xo-web
export { uploadPatch as patch }

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
  await this.checkPermissions(
    this.user.id,
    sources.map(source => [source, 'administrate'])
  )
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
