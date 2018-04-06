import { forEach } from 'lodash'

import { streamToBuffer } from '../utils'

// ===================================================================

export function clean () {
  return this.clean()
}

clean.permission = 'admin'

// -------------------------------------------------------------------

export async function exportConfig () {
  return {
    $getFrom: await this.registerHttpRequest(
      (req, res) => {
        res.writeHead(200, 'OK', {
          'content-disposition': 'attachment',
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

function handleGetAllObjects (req, res, { filter, limit }) {
  forEach(this.getObjects({ filter, limit }), object => {
    res.write(JSON.stringify(object))
    res.write('\n')
  })
  res.end()
}

export function getAllObjects ({ filter, limit, ndjson = false }) {
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
}

// -------------------------------------------------------------------

export async function importConfig () {
  return {
    $sendTo: await this.registerHttpRequest(async (req, res) => {
      await this.importConfig(JSON.parse(await streamToBuffer(req)))

      res.end('config successfully imported')
    }),
  }
}

importConfig.permission = 'admin'
