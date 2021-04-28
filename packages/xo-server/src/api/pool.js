import { format } from 'json-rpc-peer'

// ===================================================================

export async function set({
  pool,

  name_description: nameDescription,
  name_label: nameLabel,
  migrationNetwork,
}) {
  pool = this.getXapiObject(pool)

  await Promise.all([
    nameDescription !== undefined && pool.set_name_description(nameDescription),
    nameLabel !== undefined && pool.set_name_label(nameLabel),
    migrationNetwork !== undefined && pool.update_other_config('xo:migrationNetwork', migrationNetwork),
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
  migrationNetwork: {
    type: ['string', 'null'],
    optional: true,
  },
}

set.resolve = {
  pool: ['id', 'pool', 'administrate'],
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
  await this.getXapi(hosts === undefined ? pool : hosts[0]).installPatches({
    patches,
    hosts,
  })
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

export async function rollingUpdate({ pool }) {
  await this.getXapi(pool).rollingPoolUpdate()
}

rollingUpdate.params = {
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
