// ===================================================================

export async function set (params) {
  const {pool} = params
  delete params.pool

  await this.getXAPI(pool).setPoolProperties(params)
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
  pool: ['id', 'pool']
}

// -------------------------------------------------------------------

export async function installPatch ({pool, patch: patchUuid}) {
  await this.getXAPI(pool).installPoolPatchOnAllHosts(patchUuid)
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
  pool: ['pool', 'pool']
}

// -------------------------------------------------------------------

async function handlePatchUpload (req, res, {pool}) {
  const {headers: {['content-length']: contentLength}} = req
  if (!contentLength) {
    res.writeHead(400)
    res.end('Content length is mandatory')
    return
  }

  await this.getXAPI(pool).uploadPoolPatch(req, contentLength)
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
  pool: ['pool', 'pool']
}

// TODO: compatibility
export {uploadPatch as patch}
