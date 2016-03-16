import {GenericError} from '../api-errors'

// ===================================================================

export async function set ({
  pool,

  // TODO: use camel case.
  name_description: nameDescription,
  name_label: nameLabel
}) {
  await this.getXapi(pool).setPoolProperties({
    nameDescription,
    nameLabel
  })
}

set.params = {
  id: {
    type: 'string'
  },
  name_label: {
    type: 'string',
    optional: true
  },
  name_description: {
    type: 'string',
    optional: true
  }
}

set.resolve = {
  pool: ['id', 'pool', 'administrate']
}

// -------------------------------------------------------------------

export async function setDefaultSr ({pool, sr}) {
  await this.getXapi(pool).setDefaultSr(sr._xapiId)
}

setDefaultSr.params = {
  pool: {
    type: 'string'
  },
  sr: {
    type: 'string'
  }
}

setDefaultSr.resolve = {
  pool: ['pool', 'pool', 'administrate'],
  sr: ['sr', 'SR']
}
// -------------------------------------------------------------------

export async function installPatch ({pool, patch: patchUuid}) {
  await this.getXapi(pool).installPoolPatchOnAllHosts(patchUuid)
}

installPatch.params = {
  pool: {
    type: 'string'
  },
  patch: {
    type: 'string'
  }
}

installPatch.resolve = {
  pool: ['pool', 'pool', 'administrate']
}

// -------------------------------------------------------------------

async function handlePatchUpload (req, res, {pool}) {
  const {headers: {['content-length']: contentLength}} = req
  if (!contentLength) {
    res.writeHead(411)
    res.end('Content length is mandatory')
    return
  }

  await this.getXapi(pool).uploadPoolPatch(req, contentLength)
}

export async function uploadPatch ({pool}) {
  return {
    $sendTo: await this.registerHttpRequest(handlePatchUpload, {pool})
  }
}

uploadPatch.params = {
  pool: { type: 'string' }
}

uploadPatch.resolve = {
  pool: ['pool', 'pool', 'administrate']
}

// Compatibility
//
// TODO: remove when no longer used in xo-web
export {uploadPatch as patch}

// -------------------------------------------------------------------

export async function mergeInto ({ source, target, force }) {
  try {
    await this.mergeXenPools(source._xapiId, target._xapiId, force)
  } catch (e) {
    // FIXME: should we expose plain XAPI error messages?
    throw new GenericError(e.message)
  }
}

mergeInto.params = {
  force: { type: 'boolean', optional: true },
  source: { type: 'string' },
  target: { type: 'string' }
}

mergeInto.resolve = {
  source: ['source', 'pool', 'administrate'],
  target: ['target', 'pool', 'administrate']
}

// -------------------------------------------------------------------

export async function getLicenseState ({pool}) {
  return this.getXapi(pool).call(
    'pool.get_license_state',
    pool._xapiId.$ref,
  )
}

getLicenseState.params = {
  pool: {
    type: 'string'
  }
}

getLicenseState.resolve = {
  pool: ['pool', 'pool', 'administrate']
}
