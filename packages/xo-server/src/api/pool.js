import { format, JsonRPcError } from 'json-rpc-peer'

// ===================================================================

export async function set({
  pool,

  // TODO: use camel case.
  name_description: nameDescription,
  name_label: nameLabel,
}) {
  await this.getXapi(pool).setPoolProperties({
    nameDescription,
    nameLabel,
  })
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
}

set.resolve = {
  pool: ['id', 'pool', 'administrate'],
}

// -------------------------------------------------------------------

export async function setDefaultSr({ sr }) {
  await this.hasPermissions(this.user.id, [[sr.$pool, 'administrate']])

  await this.getXapi(sr).setDefaultSr(sr._xapiId)
}

setDefaultSr.permission = '' // signed in

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

listMissingPatches.description =
  'return an array of missing new patches in the host'

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

export async function mergeInto({ source, target, force }) {
  const sourceHost = this.getObject(source.master)
  const targetHost = this.getObject(target.master)

  if (sourceHost.productBrand !== targetHost.productBrand) {
    throw new Error(
      `a ${sourceHost.productBrand} pool cannot be merged into a ${
        targetHost.productBrand
      } pool`
    )
  }

  const counterDiff = this.getPatchesDifference(source.master, target.master)
  if (counterDiff.length > 0) {
    const targetXapi = this.getXapi(target)
    await targetXapi.installPatches({
      patches: await targetXapi.findPatches(counterDiff),
    })
  }

  const diff = this.getPatchesDifference(target.master, source.master)
  if (diff.length > 0) {
    const sourceXapi = this.getXapi(source)
    await sourceXapi.installPatches({
      patches: await sourceXapi.findPatches(diff),
    })
  }

  await this.mergeXenPools(source._xapiId, target._xapiId, force)
}

mergeInto.params = {
  force: { type: 'boolean', optional: true },
  source: { type: 'string' },
  target: { type: 'string' },
}

mergeInto.resolve = {
  source: ['source', 'pool', 'administrate'],
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

  try {
    await xapi.installSupplementalPackOnAllHosts(req)
    res.end(format.response(0))
  } catch (e) {
    res.writeHead(500)
    res.end(format.error(0, new JsonRPcError(e.message)))
  }
}

export async function installSupplementalPack({ pool }) {
  return {
    $sendTo: await this.registerHttpRequest(handleInstallSupplementalPack, {
      poolId: pool.id,
    }),
  }
}

installSupplementalPack.description =
  'installs supplemental pack from ISO file on all hosts'

installSupplementalPack.params = {
  pool: { type: 'string' },
}

installSupplementalPack.resolve = {
  pool: ['pool', 'pool', 'admin'],
}
