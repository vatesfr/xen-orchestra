import getStream from 'get-stream'
import { fromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

import createNdJsonStream from '../_createNdJsonStream'

// ===================================================================

export function clean() {
  return this.clean()
}

clean.permission = 'admin'

// -------------------------------------------------------------------

export async function exportConfig() {
  return {
    $getFrom: await this.registerHttpRequest(
      (req, res) => {
        res.writeHead(200, 'OK', {
          'content-disposition': 'attachment',
          'content-type': 'application/json',
        })

        return this.exportConfig()
      },
      undefined,
      { suffix: '/config.json' }
    ),
  }
}

exportConfig.permission = 'admin'

// -------------------------------------------------------------------

function handleGetAllObjects(req, res, { filter, limit }) {
  const objects = this.getObjects({ filter, limit })
  res.set('Content-Type', 'application/json')
  return fromCallback(cb => pipeline(createNdJsonStream(objects), res, cb))
}

export function getAllObjects({ filter, limit, ndjson = false }) {
  return ndjson
    ? this.registerHttpRequest(handleGetAllObjects, { filter, limit }).then(
        $getFrom => ({ $getFrom })
      )
    : this.getObjects({ filter, limit })
}

getAllObjects.permission = ''
getAllObjects.description = 'Returns all XO objects'

getAllObjects.params = {
  filter: { type: 'object', optional: true },
  limit: { type: 'number', optional: true },
  ndjson: { type: 'boolean', optional: true },
}

// -------------------------------------------------------------------

export async function importConfig() {
  return {
    $sendTo: await this.registerHttpRequest(async (req, res) => {
      await this.importConfig(JSON.parse(await getStream.buffer(req)))

      res.end('config successfully imported')
    }),
  }
}

importConfig.permission = 'admin'
